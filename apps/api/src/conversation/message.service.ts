import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, type Message } from '@prisma/client';
import {
  MessageType,
  OrderChatEvent,
  ThreadParticipantState,
  photoUrlsFromMessage,
  type CursorPage,
  type ListThreadMessagesQuery,
  type MessageReference,
  type MessageReplyPreview,
  type MessageView,
  type SendMessageDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { ThreadService } from './thread.service';
import { ConversationSerializer } from './conversation.serializer';
import { ReferenceResolver } from './reference-resolver';
import { DomainEvents } from '../events/events.module';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threads: ThreadService,
    private readonly serializer: ConversationSerializer,
    private readonly references: ReferenceResolver,
    private readonly events: DomainEvents,
  ) {}

  async send(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    const mine = await this.threads.membershipOrThrow(threadId, actorCompanyId, role);
    await this.validateReference(actorCompanyId, dto);
    await this.validateReplyTarget(threadId, dto.replyToMessageId);

    const now = new Date();
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          threadId,
          senderCompanyId: actorCompanyId,
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

    await this.announce(threadId, actorCompanyId, message.id, dto);

    const references = await this.references.resolve([message], actorCompanyId);
    const replyMap = await this.replyPreviews([message], actorCompanyId);
    return this.serializer.toMessageView(
      message,
      actorCompanyId,
      references.get(message.id) ?? null,
      replyMap.get(message.id) ?? null,
    );
  }

  async list(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    query: ListThreadMessagesQuery,
  ): Promise<CursorPage<MessageView>> {
    await this.threads.membershipOrThrow(threadId, actorCompanyId, role);

    const where = this.listWhere(threadId, query);
    const rows = await this.prisma.message.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const references = await this.references.resolve(page, actorCompanyId);
    const replyMap = await this.replyPreviews(page, actorCompanyId);
    const results = page.map((message) =>
      this.serializer.toMessageView(
        message,
        actorCompanyId,
        references.get(message.id) ?? null,
        replyMap.get(message.id) ?? null,
      ),
    );
    const last = page[page.length - 1];
    return { results, nextCursor: hasMore && last ? last.id : null };
  }

  private listWhere(threadId: string, query: ListThreadMessagesQuery): Prisma.MessageWhereInput {
    const view = query.view ?? 'all';
    const q = query.q?.trim();
    const clauses: Prisma.MessageWhereInput[] = [{ threadId }];

    if (view === 'media') {
      clauses.push({ type: { in: [MessageType.Photo, MessageType.Voice] } });
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
      clauses.push({
        OR: [
          { body: { contains: q, mode: 'insensitive' } },
          { metadata: { path: ['orderLabel'], string_contains: q } },
        ],
      });
    }

    return clauses.length === 1 ? clauses[0]! : { AND: clauses };
  }

  /**
   * Announces a new message to the other active participants so Notifications can
   * project it. Pending recipients (a first message in the requests inbox) are
   * excluded — they are notified through the requests inbox, not the feed.
   */
  private async announce(
    threadId: string,
    senderCompanyId: string,
    messageId: string,
    dto: SendMessageDto,
  ): Promise<void> {
    const others = await this.prisma.threadParticipant.findMany({
      where: {
        threadId,
        state: ThreadParticipantState.Active,
        leftAt: null,
        companyId: { not: senderCompanyId },
      },
      select: { companyId: true },
    });
    if (others.length === 0) {
      return;
    }
    this.events.messageSent({
      threadId,
      messageId,
      senderCompanyId,
      recipientCompanyIds: others.map((participant) => participant.companyId),
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
    const body = message.body?.trim();
    if (body) {
      return body.length > 80 ? `${body.slice(0, 80)}…` : body;
    }
    return 'Message';
  }

  /**
   * Cards may reference objects the sender owns, or objects already shared into
   * a chat they belong to (forward). Finer access rights come later.
   */
  private async validateReference(actorCompanyId: string, dto: SendMessageDto): Promise<void> {
    if (dto.type === MessageType.ProductCard) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.referenceId, companyId: actorCompanyId },
        select: { id: true },
      });
      if (product) {
        return;
      }
      if (
        dto.referenceId &&
        (await this.wasSharedInChat(actorCompanyId, dto.referenceId, MessageType.ProductCard))
      ) {
        return;
      }
      throw this.invalidReference();
    } else if (dto.type === MessageType.CollectionCard) {
      const collection = await this.prisma.collection.findFirst({
        where: { id: dto.referenceId, companyId: actorCompanyId },
        select: { id: true },
      });
      if (collection) {
        return;
      }
      if (
        dto.referenceId &&
        (await this.wasSharedInChat(actorCompanyId, dto.referenceId, MessageType.CollectionCard))
      ) {
        return;
      }
      throw this.invalidReference();
    } else if (dto.type === MessageType.OrderCard || dto.type === MessageType.Rate) {
      const order = await this.prisma.order.findFirst({
        where: {
          id: dto.referenceId,
          OR: [{ buyerCompanyId: actorCompanyId }, { sellerCompanyId: actorCompanyId }],
        },
        select: { id: true },
      });
      if (!order) {
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
}
