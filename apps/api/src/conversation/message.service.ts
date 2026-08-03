import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  MessageType,
  ThreadParticipantState,
  type CursorPage,
  type CursorPageQuery,
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

    const references = await this.references.resolve([message]);
    return this.serializer.toMessageView(message, actorCompanyId, references.get(message.id) ?? null);
  }

  async list(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    query: CursorPageQuery,
  ): Promise<CursorPage<MessageView>> {
    await this.threads.membershipOrThrow(threadId, actorCompanyId, role);

    const rows = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const references = await this.references.resolve(page);
    const results = page.map((message) =>
      this.serializer.toMessageView(message, actorCompanyId, references.get(message.id) ?? null),
    );
    const last = page[page.length - 1];
    return { results, nextCursor: hasMore && last ? last.id : null };
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

  /**
   * A card may only reference a trade object the sender owns, so ids for other
   * companies' private objects can never be probed through a shared card.
   */
  private async validateReference(actorCompanyId: string, dto: SendMessageDto): Promise<void> {
    if (dto.type === MessageType.ProductCard) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.referenceId, companyId: actorCompanyId },
        select: { id: true },
      });
      if (!product) {
        throw this.invalidReference();
      }
    } else if (dto.type === MessageType.CollectionCard) {
      const collection = await this.prisma.collection.findFirst({
        where: { id: dto.referenceId, companyId: actorCompanyId },
        select: { id: true },
      });
      if (!collection) {
        throw this.invalidReference();
      }
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

  private invalidReference(): BadRequestException {
    return new BadRequestException({
      code: 'INVALID_REFERENCE',
      message: 'You can only share your own products and collections.',
    });
  }
}
