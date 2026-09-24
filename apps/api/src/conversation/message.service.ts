import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, type Message } from '@prisma/client';
import {
  MessageType,
  OrderChatEvent,
  ProductStatus,
  ThreadMemberState,
  ThreadParticipantState,
  mentionsFromMetadata,
  withMentionsMetadata,
  canDeleteForEveryoneMeta,
  canEditMessageMeta,
  documentFromMessage,
  documentTypeCue,
  designAlbumCaption,
  designAlbumProductIdsFromMessage,
  photoUrlsFromMessage,
  quotedPhotoUrl,
  replyPhotoIndexFromMetadata,
  type CrossChatFindItemView,
  type CrossChatFindKind,
  type CursorPage,
  type ListCrossChatFindQuery,
  type ListThreadMessagesQuery,
  type MessageReference,
  type MessageReplyPreview,
  type MessageView,
  CHAT_REACTION_EMOJIS,
  type ChatReactionEmoji,
  type ReactMessageDto,
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
import { foldMessageReactions } from './message-reactions';

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
    await this.validateReplyTarget(threadId, dto.replyToMessageId, dto.replyToPhotoIndex);
    const mentionWork = await this.resolveMentions(threadId, actor.userId, actorCompanyId, dto);

    const sender = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { name: true },
    });
    const senderName = sender?.name?.trim() || null;

    const designIds =
      dto.type === MessageType.DesignAlbum
        ? designAlbumProductIdsFromMessage(dto.metadata)
        : [];
    const body =
      dto.type === MessageType.DesignAlbum
        ? designAlbumCaption(designIds.length)
        : (dto.body ?? null);
    const metadata = this.withReplyPhotoIndex(
      dto.type === MessageType.DesignAlbum
        ? { productIds: designIds }
        : mentionWork.metadata,
      dto.replyToPhotoIndex,
    );

    const now = new Date();
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          threadId,
          senderCompanyId: actorCompanyId,
          senderUserId: actor.userId,
          senderName,
          type: dto.type,
          body,
          referenceId: dto.referenceId ?? null,
          metadata,
          replyToMessageId: dto.replyToMessageId ?? null,
        },
      });
      await tx.thread.update({ where: { id: threadId }, data: { lastMessageAt: now } });
      // Sending is an implicit read, and replying to a request accepts it.
      await tx.threadParticipant.update({
        where: { id: mine.id },
        data: {
          lastReadAt: now,
          inboxHiddenAt: null,
          ...(mine.state === ThreadParticipantState.Pending
            ? { state: ThreadParticipantState.Active }
            : {}),
        },
      });
      return created;
    });

    await this.threads.revealActiveInboxes(threadId);
    const nudged = await this.threads.nudgeArchivedRecipients(threadId, actorCompanyId);
    await this.announce(threadId, actorCompanyId, message.id, dto, [
      ...nudged,
      ...mentionWork.extraUserIds,
    ]);

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
    const ids = page.map((row) => row.id);
    const starredIds = await this.starredIdsFor(actor.userId, actorCompanyId, ids);
    const reactions = await this.reactionsFor(actorCompanyId, ids);
    const results = page.map((message) =>
      scrubOrderMessageView(
        this.serializer.toMessageView(
          message,
          actorCompanyId,
          actor.userId,
          references.get(message.id) ?? null,
          replyMap.get(message.id) ?? null,
          { starred: starredIds.has(message.id), reactions: reactions.get(message.id) ?? [] },
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
    } else if (view === 'documents') {
      clauses.push({ type: MessageType.Document });
    } else if (view === 'media') {
      // Deprecated alias — older clients asked for photo+voice.
      clauses.push({ type: { in: [MessageType.Photo, MessageType.Voice] } });
    } else if (view === 'collections') {
      clauses.push({ type: MessageType.CollectionCard });
    } else if (view === 'designs') {
      clauses.push({
        type: { in: [MessageType.ProductCard, MessageType.DesignAlbum] },
      });
    } else if (view === 'links') {
      clauses.push({
        type: MessageType.Text,
        OR: [
          { body: { contains: 'http://', mode: 'insensitive' } },
          { body: { contains: 'https://', mode: 'insensitive' } },
          { body: { contains: 'www.', mode: 'insensitive' } },
        ],
      });
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

  private async reactionsFor(
    viewerCompanyId: string,
    messageIds: string[],
  ): Promise<Map<string, NonNullable<MessageView['reactions']>>> {
    if (messageIds.length === 0) return new Map();
    const table = this.prisma.messageReaction;
    if (!table) return new Map();
    const rows = await table.findMany({
      where: { messageId: { in: messageIds } },
      select: { messageId: true, emoji: true, companyId: true },
    });
    return foldMessageReactions(rows, viewerCompanyId);
  }

  async react(
    actor: AuthPrincipal,
    threadId: string,
    messageId: string,
    dto: ReactMessageDto,
  ): Promise<MessageView> {
    const actorCompanyId = assertActiveCompany(actor);
    await this.threads.membershipOrThrow(threadId, actorCompanyId, actor.role, actor.userId);
    const message = await this.loadMessageInThread(threadId, messageId);
    if (message.deletedForEveryoneAt) {
      throw new BadRequestException({ code: 'GONE', message: 'This message was deleted.' });
    }
    const emoji = dto.emoji;
    if (emoji == null) {
      await this.prisma.messageReaction.deleteMany({
        where: { messageId, companyId: actorCompanyId },
      });
      return this.viewOne(actor, message);
    }
    if (!(CHAT_REACTION_EMOJIS as readonly string[]).includes(emoji)) {
      throw new BadRequestException({ code: 'BAD_EMOJI', message: 'That reaction is not allowed.' });
    }
    await this.prisma.messageReaction.upsert({
      where: { messageId_companyId: { messageId, companyId: actorCompanyId } },
      create: {
        messageId,
        companyId: actorCompanyId,
        userId: actor.userId,
        emoji: emoji as ChatReactionEmoji,
      },
      update: { emoji: emoji as ChatReactionEmoji, userId: actor.userId },
    });
    return this.viewOne(actor, message);
  }

  /** Keep mentions that are on this thread. Mentioned people are pinged even if muted. */
  private async resolveMentions(
    threadId: string,
    actorUserId: string,
    actorCompanyId: string,
    dto: SendMessageDto,
  ): Promise<{ metadata: Prisma.InputJsonValue | undefined; extraUserIds: string[] }> {
    const raw = mentionsFromMetadata(dto.metadata);
    const base =
      dto.metadata && typeof dto.metadata === 'object'
        ? { ...(dto.metadata as Record<string, unknown>) }
        : undefined;
    if (raw.length === 0) {
      if (base) delete base.mentions;
      return {
        metadata: base && Object.keys(base).length ? (base as Prisma.InputJsonValue) : undefined,
        extraUserIds: [],
      };
    }
    const [members, parties] = await Promise.all([
      this.prisma.threadMember.findMany({
        where: { threadId, state: ThreadMemberState.Active },
        select: { userId: true, companyId: true },
      }),
      this.prisma.threadParticipant.findMany({
        where: {
          threadId,
          leftAt: null,
          state: { in: [ThreadParticipantState.Active, ThreadParticipantState.Pending] },
        },
        select: { companyId: true },
      }),
    ]);
    const memberByUser = new Map(members.map((row) => [row.userId, row]));
    const partyIds = new Set(parties.map((row) => row.companyId));
    const kept: ReturnType<typeof mentionsFromMetadata> = [];
    const extra: string[] = [];
    for (const row of raw) {
      if (row.kind === 'user') {
        if (!memberByUser.has(row.id)) continue;
        kept.push(row);
        if (row.id !== actorUserId) extra.push(row.id);
        continue;
      }
      if (!partyIds.has(row.id) || row.id === actorCompanyId) continue;
      kept.push(row);
      for (const member of members) {
        if (member.companyId === row.id && member.userId !== actorUserId) {
          extra.push(member.userId);
        }
      }
    }
    const next = withMentionsMetadata(base, kept);
    return {
      metadata: next ? (next as Prisma.InputJsonValue) : undefined,
      extraUserIds: [...new Set(extra)],
    };
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

  private withReplyPhotoIndex(
    metadata: Prisma.InputJsonValue | undefined,
    index: number | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (index == null) return metadata;
    const base =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? { ...(metadata as Record<string, unknown>) }
        : {};
    return { ...base, replyToPhotoIndex: index } as Prisma.InputJsonValue;
  }

  private async validateReplyTarget(
    threadId: string,
    replyToMessageId: string | undefined,
    replyToPhotoIndex?: number,
  ): Promise<void> {
    if (!replyToMessageId) {
      return;
    }
    const parent = await this.prisma.message.findFirst({
      where: { id: replyToMessageId, threadId },
    });
    if (!parent) {
      throw new BadRequestException({
        code: 'INVALID_REPLY',
        message: 'You can only reply to a message in this chat.',
      });
    }
    if (replyToPhotoIndex == null) return;
    if (parent.type !== MessageType.Photo) {
      throw new BadRequestException({
        code: 'INVALID_REPLY_PHOTO',
        message: 'You can only quote a photo from a photo message.',
      });
    }
    const urls = photoUrlsFromMessage(parent);
    if (replyToPhotoIndex >= urls.length) {
      throw new BadRequestException({
        code: 'INVALID_REPLY_PHOTO',
        message: 'That photo is not in this album.',
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
      const photoIndex = replyPhotoIndexFromMetadata(message.metadata);
      const photoUrl =
        parent.type === MessageType.Photo ? quotedPhotoUrl(parent, photoIndex) : null;
      result.set(message.id, {
        id: parent.id,
        type: parent.type,
        bodyPreview: this.replyBodyPreview(parent, reference, photoIndex),
        available: true,
        photoIndex,
        photoUrl,
      });
    }
    return result;
  }

  private replyBodyPreview(
    message: Message,
    reference: MessageReference | null,
    photoIndex: number | null = null,
  ): string | null {
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
      if (photoIndex != null && count > 1) return 'Photo';
      return count > 1 ? `${count} photos` : 'Photo';
    }
    if (message.type === MessageType.Voice) {
      return 'Voice';
    }
    if (message.type === MessageType.Document) {
      const doc = documentFromMessage(message);
      if (doc) {
        const cue = documentTypeCue(doc.contentType, doc.fileName);
        return `${cue} · ${doc.fileName}`;
      }
      return 'Document';
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
    if (dto.type === MessageType.DesignAlbum) {
      const productIds = designAlbumProductIdsFromMessage(dto.metadata);
      if (productIds.length < 2) {
        throw this.invalidReference();
      }
      for (const productId of productIds) {
        await this.validateProductShareable(actorCompanyId, productId);
      }
      return;
    }
    if (dto.type === MessageType.ProductCard) {
      await this.validateProductShareable(actorCompanyId, dto.referenceId!);
      return;
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

  private async validateProductShareable(
    actorCompanyId: string,
    productId: string,
  ): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId },
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

  /**
   * Cross-chat find from Chats list search: Photos / Documents / Collections / Designs.
   * Only messages in threads the viewer still belongs to; hides + deleted-for-everyone excluded.
   */
  async listFind(
    actor: AuthPrincipal,
    query: ListCrossChatFindQuery,
  ): Promise<CursorPage<CrossChatFindItemView>> {
    const actorCompanyId = assertActiveCompany(actor);
    const clauses: Prisma.MessageWhereInput[] = [
      findKindWhere(query.kind),
      { deletedForEveryoneAt: null },
      { NOT: { hides: { some: { companyId: actorCompanyId } } } },
      {
        thread: {
          participants: {
            some: {
              companyId: actorCompanyId,
              leftAt: null,
            },
          },
        },
      },
    ];
    const q = query.q?.trim();
    if (q) {
      const searchOr = await messageSearchOrClause(this.prisma, q);
      if (searchOr) {
        clauses.push(searchOr);
      }
    }

    const rows = await this.prisma.message.findMany({
      where: { AND: clauses },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const references = await this.references.resolve(page, actorCompanyId);
    const starredIds = await this.starredIdsFor(
      actor.userId,
      actorCompanyId,
      page.map((row) => row.id),
    );
    const threadIds = [...new Set(page.map((m) => m.threadId))];
    const threads = await this.prisma.thread.findMany({
      where: { id: { in: threadIds } },
      select: {
        id: true,
        title: true,
        participants: {
          where: { leftAt: null, NOT: { companyId: actorCompanyId } },
          take: 1,
          include: { company: true },
        },
      },
    });
    const threadById = new Map(threads.map((t) => [t.id, t]));
    const results = page.map((message) => {
      const thread = threadById.get(message.threadId);
      const counterpart = thread?.participants[0]?.company?.name ?? null;
      return {
        message: scrubOrderMessageView(
          this.serializer.toMessageView(
            message,
            actorCompanyId,
            actor.userId,
            references.get(message.id) ?? null,
            null,
            { starred: starredIds.has(message.id) },
            // reactions filled below if we load them — keep find rows light
          ),
        ),
        threadId: message.threadId,
        threadTitle: thread?.title ?? null,
        counterpartName: counterpart,
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
    const reactions = await this.reactionsFor(actorCompanyId, [message.id]);
    return scrubOrderMessageView(
      this.serializer.toMessageView(
        message,
        actorCompanyId,
        actor.userId,
        references.get(message.id) ?? null,
        null,
        { starred: starred.has(message.id), reactions: reactions.get(message.id) ?? [] },
      ),
    );
  }
}

function findKindWhere(kind: CrossChatFindKind): Prisma.MessageWhereInput {
  switch (kind) {
    case 'photos':
      return { type: MessageType.Photo };
    case 'documents':
      return { type: MessageType.Document };
    case 'collections':
      return { type: MessageType.CollectionCard };
    case 'designs':
      return { type: { in: [MessageType.ProductCard, MessageType.DesignAlbum] } };
    case 'links':
      return {
        type: MessageType.Text,
        OR: [
          { body: { contains: 'http://', mode: 'insensitive' } },
          { body: { contains: 'https://', mode: 'insensitive' } },
          { body: { contains: 'www.', mode: 'insensitive' } },
        ],
      };
  }
}
