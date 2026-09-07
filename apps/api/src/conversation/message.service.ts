import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, type Message } from '@prisma/client';
import {
  MessageType,
  OrderChatEvent,
  ProductStatus,
  ThreadParticipantState,
  canDeleteForEveryoneMeta,
  canEditMessageMeta,
  photoUrlsFromMessage,
  type CursorPage,
  type ListThreadMessagesQuery,
  type MessageReference,
  type MessageReplyPreview,
  type MessageView,
  type SendMessageDto,
  type StarredMessageView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { isCollectionLiveForBuyers } from '../catalog/collection-schedule';
import { ThreadService } from './thread.service';
import { ConversationSerializer } from './conversation.serializer';
import { ReferenceResolver } from './reference-resolver';
import { DomainEvents } from '../events/events.module';
import type { AuthPrincipal } from '../auth/auth.types';
import { assertActiveCompany } from '../auth/require-permission';
import { messageSearchOrClause } from './message-search';
import { messageVisibleToCompany } from './side-message';
import { isHeldFromSupplier } from '../orders/orderHold';
import { scrubOrderMessageView } from '../orders/i-handle-soft-hide';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threads: ThreadService,
    private readonly serializer: ConversationSerializer,
    private readonly references: ReferenceResolver,
    private readonly events: DomainEvents,
    private readonly visibility: VisibilityService,
  ) {}

  async send(
    actor: AuthPrincipal,
    threadId: string,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    const actorCompanyId = assertActiveCompany(actor);
    const mine = await this.threads.membershipOrThrow(
      threadId,
      actorCompanyId,
      actor.role,
      actor.userId,
    );
    await this.validateReference(actorCompanyId, dto);
    await this.validateReplyTarget(threadId, dto.replyToMessageId);

    const sender = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { name: true },
    });
    const senderName = sender?.name?.trim() || null;

    const now = new Date();
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          threadId,
          senderCompanyId: actorCompanyId,
          senderUserId: actor.userId,
          senderName,
          type: dto.type,
          body: dto.body ?? null,
          referenceId: dto.referenceId ?? null,
          metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
          replyToMessageId: dto.replyToMessageId ?? null,
        },
      });
      await tx.thread.update({ where: { id: threadId }, data: { lastMessageAt: now } });
      // Sending is an implicit read, and replying to a request accepts it.
      await tx.threadParticipant.update({
        where: { id: mine.id },
        data: {
          lastReadAt: now,
          ...(mine.state === ThreadParticipantState.Pending
            ? { state: ThreadParticipantState.Active }
            : {}),
        },
      });
      return created;
    });

    const nudged = await this.threads.nudgeArchivedRecipients(threadId, actorCompanyId);
    await this.announce(threadId, actorCompanyId, message.id, dto, nudged);

    const references = await this.references.resolve([message], actorCompanyId);
    const replyMap = await this.replyPreviews([message], actorCompanyId);
    return scrubOrderMessageView(
      this.serializer.toMessageView(
        message,
        actorCompanyId,
        actor.userId,
        references.get(message.id) ?? null,
        replyMap.get(message.id) ?? null,
      ),
    );
  }

  async list(
    actor: AuthPrincipal,
    threadId: string,
    query: ListThreadMessagesQuery,
  ): Promise<CursorPage<MessageView>> {
    const actorCompanyId = assertActiveCompany(actor);
    await this.threads.membershipOrThrow(threadId, actorCompanyId, actor.role, actor.userId);

    const where = await this.listWhere(threadId, query, {
      companyId: actorCompanyId,
      userId: actor.userId,
    });
    const rows = await this.prisma.message.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > query.limit;
    const page = (hasMore ? rows.slice(0, query.limit) : rows).filter((row) =>
      messageVisibleToCompany(row, actorCompanyId),
    );
    const references = await this.references.resolve(page, actorCompanyId);
    const replyMap = await this.replyPreviews(page, actorCompanyId);
    const starredIds = await this.starredIdsFor(
      actor.userId,
      actorCompanyId,
      page.map((row) => row.id),
    );
    const results = page.map((message) =>
      scrubOrderMessageView(
        this.serializer.toMessageView(
          message,
          actorCompanyId,
          actor.userId,
          references.get(message.id) ?? null,
          replyMap.get(message.id) ?? null,
          { starred: starredIds.has(message.id) },
        ),
      ),
    );
    const last = page[page.length - 1];
    return { results, nextCursor: hasMore && last ? last.id : null };
  }

  private async listWhere(
    threadId: string,
    query: ListThreadMessagesQuery,
    actor: { companyId: string; userId: string },
  ): Promise<Prisma.MessageWhereInput> {
    const view = query.view ?? 'all';
    const q = query.q?.trim();
    const clauses: Prisma.MessageWhereInput[] = [
      { threadId },
      { NOT: { hides: { some: { companyId: actor.companyId } } } },
    ];

    if (view === 'starred') {
      clauses.push({
        stars: { some: { userId: actor.userId, companyId: actor.companyId } },
      });
    } else if (view === 'photos') {
      clauses.push({ type: MessageType.Photo });
    } else if (view === 'media') {
      // Deprecated alias — older clients asked for photo+voice.
      clauses.push({ type: { in: [MessageType.Photo, MessageType.Voice] } });
    } else if (view === 'collections') {
      clauses.push({ type: MessageType.CollectionCard });
    } else if (view === 'designs') {
      clauses.push({ type: MessageType.ProductCard });
    } else if (view === 'orders') {
      clauses.push({
        OR: [
          { type: { in: [MessageType.OrderCard, MessageType.Rate] } },
          {
            type: MessageType.System,
            OR: [
              { metadata: { path: ['kind'], equals: 'order_lines' } },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.QuoteAccepted,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.OrderDispatched,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.OrderDelivered,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.OrderCancelled,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.OrderDeclined,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.OrderRequested,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.RateRequested,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.OrderUpdated,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.QuoteSent,
                },
              },
              {
                metadata: {
                  path: ['event'],
                  equals: OrderChatEvent.LinesDecided,
                },
              },
            ],
          },
        ],
      });
    }

    if (q) {
      const searchOr = await messageSearchOrClause(this.prisma, q, { threadId });
      if (searchOr) {
        clauses.push(searchOr);
      }
    }

    return { AND: clauses };
  }

  private async starredIdsFor(
    userId: string,
    companyId: string,
    messageIds: string[],
  ): Promise<Set<string>> {
    if (messageIds.length === 0) return new Set();
    const rows = await this.prisma.messageStar.findMany({
      where: { userId, companyId, messageId: { in: messageIds } },
      select: { messageId: true },
    });
    return new Set(rows.map((row) => row.messageId));
  }

  /**
   * Announces a new message to the other active participants so Notifications can
   * project it. Pending recipients (a first message in the requests inbox) are
   */
  private async announce(
    threadId: string,
    senderCompanyId: string,
    messageId: string,
    dto: SendMessageDto,
    extraUserIds: string[] = [],
  ): Promise<void> {
    const { companyIds, userIds } = await this.threads.notifyUserIdsForMessage(
      threadId,
      senderCompanyId,
    );
    const recipients = [...new Set([...userIds, ...extraUserIds])];
    if (companyIds.length === 0 && recipients.length === 0) {
      return;
    }
    this.events.messageSent({
      threadId,
      messageId,
      senderCompanyId,
      recipientCompanyIds: companyIds,
      recipientUserIds: recipients,
      preview: dto.body?.slice(0, 140) ?? `Shared a ${dto.type.replace('_', ' ')}`,
    });
  }

  private async validateReplyTarget(
    threadId: string,
    replyToMessageId: string | undefined,
  ): Promise<void> {
    if (!replyToMessageId) {
      return;
    }
    const parent = await this.prisma.message.findFirst({
      where: { id: replyToMessageId, threadId },
      select: { id: true },
    });
    if (!parent) {
      throw new BadRequestException({
        code: 'INVALID_REPLY',
        message: 'You can only reply to a message in this chat.',
      });
    }
  }

  private async replyPreviews(
    messages: Message[],
    viewerCompanyId: string,
  ): Promise<Map<string, MessageReplyPreview | null>> {
    const parentIds = [
      ...new Set(
        messages
          .map((message) => message.replyToMessageId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const result = new Map<string, MessageReplyPreview | null>();
    for (const message of messages) {
      result.set(message.id, null);
    }
    if (parentIds.length === 0) {
      return result;
    }

    const parents = await this.prisma.message.findMany({
      where: { id: { in: parentIds } },
    });
    const parentById = new Map(parents.map((parent) => [parent.id, parent]));
    const parentRefs = await this.references.resolve(parents, viewerCompanyId);

    for (const message of messages) {
      if (!message.replyToMessageId) {
        continue;
      }
      const parent = parentById.get(message.replyToMessageId);
      if (!parent) {
        result.set(message.id, {
          id: message.replyToMessageId,
          type: 'text',
          bodyPreview: 'Original message unavailable',
          available: false,
        });
        continue;
      }
      const reference = parentRefs.get(parent.id) ?? null;
      result.set(message.id, {
        id: parent.id,
        type: parent.type,
        bodyPreview: this.replyBodyPreview(parent, reference),
        available: true,
      });
    }
    return result;
  }

  private replyBodyPreview(message: Message, reference: MessageReference | null): string | null {
    if (reference?.name) {
      if (reference.kind === 'collection') {
        return `Collection · ${reference.name}`;
      }
      if (reference.kind === 'product') {
        return `Design · ${reference.name}`;
      }
      if (reference.kind === 'order' || reference.kind === 'rate') {
        return reference.name;
      }
    }
    if (message.type === MessageType.Photo) {
      const count = photoUrlsFromMessage(message).length;
      return count > 1 ? `${count} photos` : 'Photo';
    }
    if (message.type === MessageType.Voice) {
      return 'Voice';
    }
    const body = message.body?.trim();
    if (body) {
      return body.length > 80 ? `${body.slice(0, 80)}…` : body;
    }
    return 'Message';
  }

  /**
   * Forward free: pass a live catalog card as-is. View/audience is checked when
   * the recipient opens (chat share unlocks the album shell + Ask). Blocked
   * senders still cannot share. Curate stays gated elsewhere.
   */
  private async validateReference(actorCompanyId: string, dto: SendMessageDto): Promise<void> {
    if (dto.type === MessageType.ProductCard) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.referenceId },
        select: {
          id: true,
          companyId: true,
          status: true,
          postedToMarketAt: true,
        },
      });
      if (!product) {
        throw this.invalidReference();
      }
      if (product.companyId === actorCompanyId) {
        return;
      }
      if (await this.visibility.isBlocked(actorCompanyId, product.companyId)) {
        throw this.invalidReference();
      }
      if (await this.wasSharedInChat(actorCompanyId, product.id, MessageType.ProductCard)) {
        return;
      }
      if (product.status === ProductStatus.Published && product.postedToMarketAt) {
        return;
      }
      throw this.invalidReference();
    } else if (dto.type === MessageType.CollectionCard) {
      const collection = await this.prisma.collection.findFirst({
        where: { id: dto.referenceId },
        select: {
          id: true,
          companyId: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
      });
      if (!collection) {
        throw this.invalidReference();
      }
      if (collection.companyId === actorCompanyId) {
        return;
      }
      if (await this.visibility.isBlocked(actorCompanyId, collection.companyId)) {
        throw this.invalidReference();
      }
      if (
        await this.wasSharedInChat(actorCompanyId, collection.id, MessageType.CollectionCard)
      ) {
        return;
      }
      if (isCollectionLiveForBuyers(collection)) {
        return;
      }
      throw this.invalidReference();
    } else if (dto.type === MessageType.OrderCard || dto.type === MessageType.Rate) {
      const order = await this.prisma.order.findFirst({
        where: {
          id: dto.referenceId,
          OR: [
            { buyerCompanyId: actorCompanyId },
            { sellerCompanyId: actorCompanyId },
            { facilitatorCompanyId: actorCompanyId },
          ],
        },
        select: {
          id: true,
          sellerCompanyId: true,
          downstreamOrderId: true,
          upstreamReleasedAt: true,
        },
      });
      if (!order) {
        throw this.invalidReference();
      }
      if (isHeldFromSupplier(order, actorCompanyId)) {
        throw this.invalidReference();
      }
    }
  }

  private async wasSharedInChat(
    viewerCompanyId: string,
    referenceId: string,
    type: string,
  ): Promise<boolean> {
    const hit = await this.prisma.message.findFirst({
      where: {
        type,
        referenceId,
        thread: {
          participants: {
            some: { companyId: viewerCompanyId, leftAt: null },
          },
        },
      },
      select: { id: true },
    });
    return Boolean(hit);
  }

  private invalidReference(): BadRequestException {
    return new BadRequestException({
      code: 'INVALID_REFERENCE',
      message: 'You can only share objects your business can access.',
    });
  }

  async edit(
    actor: AuthPrincipal,
    threadId: string,
    messageId: string,
    body: string,
  ): Promise<MessageView> {
    const actorCompanyId = assertActiveCompany(actor);
    await this.threads.membershipOrThrow(threadId, actorCompanyId, actor.role, actor.userId);
    const message = await this.loadMessageInThread(threadId, messageId);
    if (message.senderCompanyId !== actorCompanyId) {
      throw new BadRequestException({ code: 'FORBIDDEN', message: 'You can only edit your messages.' });
    }
    if (message.type !== MessageType.Text || message.deletedForEveryoneAt) {
      throw new BadRequestException({ code: 'CANNOT_EDIT', message: 'This message cannot be edited.' });
    }
    if (
      !canEditMessageMeta({
        mine: true,
        type: message.type,
        createdAt: message.createdAt,
        deletedForEveryone: false,
      })
    ) {
      throw new BadRequestException({
        code: 'EDIT_WINDOW',
        message: 'Edit window has ended.',
      });
    }
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { body: body.trim(), editedAt: new Date() },
    });
    return this.viewOne(actor, updated);
  }

  async hide(
    actor: AuthPrincipal,
    threadId: string,
    messageId: string,
  ): Promise<{ ok: true }> {
    const actorCompanyId = assertActiveCompany(actor);
    await this.threads.membershipOrThrow(threadId, actorCompanyId, actor.role, actor.userId);
    await this.loadMessageInThread(threadId, messageId);
    await this.prisma.messageHide.upsert({
      where: {
        companyId_messageId: { companyId: actorCompanyId, messageId },
      },
      create: { companyId: actorCompanyId, messageId },
      update: {},
    });
    return { ok: true };
  }

  async deleteForEveryone(
    actor: AuthPrincipal,
    threadId: string,
    messageId: string,
  ): Promise<MessageView> {
    const actorCompanyId = assertActiveCompany(actor);
    await this.threads.membershipOrThrow(threadId, actorCompanyId, actor.role, actor.userId);
    const message = await this.loadMessageInThread(threadId, messageId);
    if (message.senderCompanyId !== actorCompanyId) {
      throw new BadRequestException({
        code: 'FORBIDDEN',
        message: 'You can only delete your messages for everyone.',
      });
    }
    if (
      !canDeleteForEveryoneMeta({
        mine: true,
        createdAt: message.createdAt,
        deletedForEveryone: Boolean(message.deletedForEveryoneAt),
      })
    ) {
      throw new BadRequestException({
        code: 'DELETE_WINDOW',
        message: 'Delete for everyone window has ended.',
      });
    }
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedForEveryoneAt: new Date(),
        body: null,
        referenceId: null,
        metadata: Prisma.JsonNull,
      },
    });
    return this.viewOne(actor, updated);
  }

  async star(actor: AuthPrincipal, messageId: string): Promise<{ ok: true }> {
    const actorCompanyId = assertActiveCompany(actor);
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new BadRequestException({ code: 'NOT_FOUND', message: 'Message not found.' });
    }
    await this.threads.membershipOrThrow(
      message.threadId,
      actorCompanyId,
      actor.role,
      actor.userId,
    );
    await this.prisma.messageStar.upsert({
      where: { userId_messageId: { userId: actor.userId, messageId } },
      create: { userId: actor.userId, companyId: actorCompanyId, messageId },
      update: {},
    });
    return { ok: true };
  }

  async unstar(actor: AuthPrincipal, messageId: string): Promise<{ ok: true }> {
    const actorCompanyId = assertActiveCompany(actor);
    await this.prisma.messageStar.deleteMany({
      where: { userId: actor.userId, companyId: actorCompanyId, messageId },
    });
    return { ok: true };
  }

  async listStarred(
    actor: AuthPrincipal,
    query: { limit: number; cursor?: string },
  ): Promise<CursorPage<StarredMessageView>> {
    const actorCompanyId = assertActiveCompany(actor);
    const rows = await this.prisma.messageStar.findMany({
      where: {
        userId: actor.userId,
        companyId: actorCompanyId,
        message: {
          deletedForEveryoneAt: null,
          NOT: { hides: { some: { companyId: actorCompanyId } } },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        message: true,
      },
    });
    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const messages = page.map((row) => row.message);
    const references = await this.references.resolve(messages, actorCompanyId);
    const threadIds = [...new Set(messages.map((m) => m.threadId))];
    const threads = await this.prisma.thread.findMany({
      where: { id: { in: threadIds } },
      select: {
        id: true,
        title: true,
        type: true,
        participants: {
          where: { leftAt: null, NOT: { companyId: actorCompanyId } },
          take: 1,
          include: { company: true },
        },
      },
    });
    const threadById = new Map(threads.map((t) => [t.id, t]));
    const results = page.map((row) => {
      const thread = threadById.get(row.message.threadId);
      const counterpart = thread?.participants[0]?.company?.name ?? null;
      return {
        message: scrubOrderMessageView(
          this.serializer.toMessageView(
            row.message,
            actorCompanyId,
            actor.userId,
            references.get(row.message.id) ?? null,
            null,
            { starred: true },
          ),
        ),
        threadId: row.message.threadId,
        threadTitle: thread?.title ?? null,
        counterpartName: counterpart,
        starredAt: row.createdAt.toISOString(),
      };
    });
    const last = page[page.length - 1];
    return { results, nextCursor: hasMore && last ? last.id : null };
  }

  private async loadMessageInThread(threadId: string, messageId: string): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, threadId },
    });
    if (!message) {
      throw new BadRequestException({ code: 'NOT_FOUND', message: 'Message not found.' });
    }
    return message;
  }

  private async viewOne(actor: AuthPrincipal, message: Message): Promise<MessageView> {
    const actorCompanyId = assertActiveCompany(actor);
    const references = await this.references.resolve([message], actorCompanyId);
    const starred = await this.starredIdsFor(actor.userId, actorCompanyId, [message.id]);
    return scrubOrderMessageView(
      this.serializer.toMessageView(
        message,
        actorCompanyId,
        actor.userId,
        references.get(message.id) ?? null,
        null,
        { starred: starred.has(message.id) },
      ),
    );
  }
}
