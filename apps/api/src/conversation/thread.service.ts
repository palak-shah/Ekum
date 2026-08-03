import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Thread, type ThreadParticipant } from '@prisma/client';
import {
  MembershipRole,
  MessageType,
  ThreadParticipantState,
  ThreadType,
  ThreadVisibility,
  type AddParticipantsDto,
  type CreateGroupThreadDto,
  type CursorPage,
  type ListThreadsQuery,
  type MessageView,
  type SetAlertLevelDto,
  type StartDirectThreadDto,
  type ThreadDetail,
  type ThreadSummary,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { ConversationSerializer } from './conversation.serializer';
import { ReferenceResolver } from './reference-resolver';

type MembershipWithThread = ThreadParticipant & { thread: Thread };

@Injectable()
export class ThreadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly serializer: ConversationSerializer,
    private readonly references: ReferenceResolver,
  ) {}

  /**
   * The one access check for a thread. Archived/left participants and (for staff)
   * owner_only threads are indistinguishable 404s. Pending is allowed so a request
   * recipient can read the thread in order to accept or decline it.
   */
  async membershipOrThrow(
    threadId: string,
    companyId: string,
    role: string | null,
  ): Promise<MembershipWithThread> {
    const participant = await this.prisma.threadParticipant.findUnique({
      where: { threadId_companyId: { threadId, companyId } },
      include: { thread: true },
    });
    if (!participant || participant.leftAt || participant.state === ThreadParticipantState.Archived) {
      throw this.notFound();
    }
    if (participant.thread.visibility === ThreadVisibility.OwnerOnly && role !== MembershipRole.Owner) {
      throw this.notFound();
    }
    return participant;
  }

  async startDirect(
    actorCompanyId: string,
    role: string | null,
    dto: StartDirectThreadDto,
  ): Promise<ThreadSummary> {
    if (dto.companyId === actorCompanyId) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'You cannot start a chat with your own business.',
      });
    }
    const target = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
      select: { id: true },
    });
    if (!target) {
      throw this.notFound();
    }

    const existing = await this.findDirectThread(actorCompanyId, dto.companyId);
    if (existing) {
      const mine = existing.participants.find((p) => p.companyId === actorCompanyId);
      if (mine && (mine.leftAt || mine.state === ThreadParticipantState.Archived)) {
        await this.prisma.threadParticipant.update({
          where: { id: mine.id },
          data: { state: ThreadParticipantState.Active, leftAt: null },
        });
      }
      return this.summaryById(existing.id, actorCompanyId, role);
    }

    // A first message to a company that has blocked you is silently dropped: the
    // thread exists on your side, but their participant is archived so it never
    // surfaces. Unconnected (but not blocked) targets receive a pending request.
    const blockedByTarget = await this.visibility.isBlocked(actorCompanyId, dto.companyId);
    const connected = await this.connectedActive(actorCompanyId, dto.companyId);
    const targetState = blockedByTarget
      ? ThreadParticipantState.Archived
      : connected
        ? ThreadParticipantState.Active
        : ThreadParticipantState.Pending;

    const thread = await this.prisma.thread.create({
      data: {
        type: ThreadType.Direct,
        visibility: dto.visibility,
        createdByCompanyId: actorCompanyId,
        participants: {
          create: [
            { companyId: actorCompanyId, state: ThreadParticipantState.Active },
            { companyId: dto.companyId, state: targetState, invitedBy: actorCompanyId },
          ],
        },
      },
    });
    return this.summaryById(thread.id, actorCompanyId, role);
  }

  async createGroup(
    actorCompanyId: string,
    role: string | null,
    dto: CreateGroupThreadDto,
  ): Promise<ThreadDetail> {
    const inviteeIds = [...new Set(dto.participantCompanyIds)].filter((id) => id !== actorCompanyId);
    if (inviteeIds.length === 0) {
      throw new BadRequestException({
        code: 'NO_PARTICIPANTS',
        message: 'A group needs at least one other business.',
      });
    }
    await this.assertInvitable(actorCompanyId, inviteeIds);

    const thread = await this.prisma.thread.create({
      data: {
        type: ThreadType.Group,
        visibility: dto.visibility,
        title: dto.title,
        createdByCompanyId: actorCompanyId,
        participants: {
          create: [
            { companyId: actorCompanyId, state: ThreadParticipantState.Active },
            ...inviteeIds.map((id) => ({
              companyId: id,
              state: ThreadParticipantState.Active,
              invitedBy: actorCompanyId,
            })),
          ],
        },
      },
    });
    return this.detail(thread.id, actorCompanyId, role);
  }

  async list(
    actorCompanyId: string,
    role: string | null,
    query: ListThreadsQuery,
  ): Promise<CursorPage<ThreadSummary>> {
    const where: Prisma.ThreadParticipantWhereInput = {
      companyId: actorCompanyId,
      state: query.state ?? ThreadParticipantState.Active,
      leftAt: null,
    };
    if (role !== MembershipRole.Owner) {
      where.thread = { visibility: { not: ThreadVisibility.OwnerOnly } };
    }

    const rows = await this.prisma.threadParticipant.findMany({
      where,
      include: { thread: { include: { participants: { include: { company: true } } } } },
      orderBy: [{ thread: { lastMessageAt: 'desc' } }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const last = pageRows[pageRows.length - 1];

    const results = await Promise.all(
      pageRows.map(async (participant) => {
        const [unreadCount, lastMessage] = await Promise.all([
          this.unreadCount(participant.threadId, actorCompanyId, participant.lastReadAt),
          this.lastMessageView(participant.threadId, actorCompanyId),
        ]);
        return this.serializer.toThreadSummary({
          thread: participant.thread,
          participants: participant.thread.participants,
          mine: participant,
          unreadCount,
          lastMessage,
        });
      }),
    );

    return { results, nextCursor: hasMore && last ? last.id : null };
  }

  get(actorCompanyId: string, role: string | null, threadId: string): Promise<ThreadDetail> {
    return this.detail(threadId, actorCompanyId, role);
  }

  async markRead(actorCompanyId: string, role: string | null, threadId: string): Promise<ThreadDetail> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role);
    await this.prisma.threadParticipant.update({
      where: { id: mine.id },
      data: { lastReadAt: new Date() },
    });
    return this.detail(threadId, actorCompanyId, role);
  }

  async setAlertLevel(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    dto: SetAlertLevelDto,
  ): Promise<ThreadDetail> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role);
    await this.prisma.threadParticipant.update({
      where: { id: mine.id },
      data: { alertLevel: dto.alertLevel },
    });
    return this.detail(threadId, actorCompanyId, role);
  }

  async accept(actorCompanyId: string, role: string | null, threadId: string): Promise<ThreadDetail> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role);
    if (mine.state === ThreadParticipantState.Pending) {
      await this.prisma.threadParticipant.update({
        where: { id: mine.id },
        data: { state: ThreadParticipantState.Active },
      });
    }
    return this.detail(threadId, actorCompanyId, role);
  }

  async decline(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
  ): Promise<{ ok: true }> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role);
    await this.prisma.threadParticipant.update({
      where: { id: mine.id },
      data: { state: ThreadParticipantState.Archived, leftAt: new Date() },
    });
    return { ok: true };
  }

  async leave(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
  ): Promise<{ ok: true }> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role);
    await this.prisma.threadParticipant.update({
      where: { id: mine.id },
      data: { state: ThreadParticipantState.Archived, leftAt: new Date() },
    });
    return { ok: true };
  }

  async addParticipants(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    dto: AddParticipantsDto,
  ): Promise<ThreadDetail> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role);
    if (mine.thread.type !== ThreadType.Group) {
      throw new BadRequestException({
        code: 'NOT_A_GROUP',
        message: 'Only group chats can have participants added.',
      });
    }

    const existing = await this.prisma.threadParticipant.findMany({
      where: { threadId },
      select: { companyId: true },
    });
    const existingIds = new Set(existing.map((participant) => participant.companyId));
    const inviteeIds = [...new Set(dto.companyIds)].filter(
      (id) => id !== actorCompanyId && !existingIds.has(id),
    );
    if (inviteeIds.length === 0) {
      return this.detail(threadId, actorCompanyId, role);
    }
    await this.assertInvitable(actorCompanyId, inviteeIds);

    await this.prisma.threadParticipant.createMany({
      data: inviteeIds.map((id) => ({
        threadId,
        companyId: id,
        state: ThreadParticipantState.Active,
        invitedBy: actorCompanyId,
      })),
    });
    return this.detail(threadId, actorCompanyId, role);
  }

  async summaryById(
    threadId: string,
    actorCompanyId: string,
    role: string | null,
  ): Promise<ThreadSummary> {
    const { thread, participants, mine } = await this.loadForViewer(threadId, actorCompanyId, role);
    const [unreadCount, lastMessage] = await Promise.all([
      this.unreadCount(threadId, actorCompanyId, mine.lastReadAt),
      this.lastMessageView(threadId, actorCompanyId),
    ]);
    return this.serializer.toThreadSummary({ thread, participants, mine, unreadCount, lastMessage });
  }

  private async detail(
    threadId: string,
    actorCompanyId: string,
    role: string | null,
  ): Promise<ThreadDetail> {
    const { thread, participants, mine } = await this.loadForViewer(threadId, actorCompanyId, role);
    const [unreadCount, lastMessage] = await Promise.all([
      this.unreadCount(threadId, actorCompanyId, mine.lastReadAt),
      this.lastMessageView(threadId, actorCompanyId),
    ]);
    return this.serializer.toThreadDetail({ thread, participants, mine, unreadCount, lastMessage });
  }

  private async loadForViewer(threadId: string, actorCompanyId: string, role: string | null) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { participants: { include: { company: true } } },
    });
    if (!thread) {
      throw this.notFound();
    }
    const mine = thread.participants.find((participant) => participant.companyId === actorCompanyId);
    if (!mine || mine.leftAt || mine.state === ThreadParticipantState.Archived) {
      throw this.notFound();
    }
    if (thread.visibility === ThreadVisibility.OwnerOnly && role !== MembershipRole.Owner) {
      throw this.notFound();
    }
    return { thread, participants: thread.participants, mine };
  }

  private async lastMessageView(
    threadId: string,
    viewerCompanyId: string,
  ): Promise<MessageView | null> {
    const [message] = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    if (!message) {
      return null;
    }
    const references = await this.references.resolve([message]);
    return this.serializer.toMessageView(message, viewerCompanyId, references.get(message.id) ?? null);
  }

  private unreadCount(
    threadId: string,
    actorCompanyId: string,
    lastReadAt: Date | null,
  ): Promise<number> {
    return this.prisma.message.count({
      where: {
        threadId,
        senderCompanyId: { not: actorCompanyId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
  }

  /**
   * Opens (or reuses) a direct thread for an access request: requester is active,
   * target is pending so it lands in their Chats → Requests inbox. Posts the
   * intro note as the first message.
   */
  async openAccessRequestThread(
    requesterCompanyId: string,
    targetCompanyId: string,
    note?: string | null,
  ): Promise<string> {
    const summary = await this.startDirect(requesterCompanyId, null, {
      companyId: targetCompanyId,
      visibility: ThreadVisibility.Shared,
    });
    const body = note?.trim() || 'Requested access to your catalogue.';
    const existingIntro = await this.prisma.message.findFirst({
      where: {
        threadId: summary.id,
        senderCompanyId: requesterCompanyId,
        body,
      },
      select: { id: true },
    });
    if (!existingIntro) {
      await this.prisma.message.create({
        data: {
          threadId: summary.id,
          senderCompanyId: requesterCompanyId,
          type: MessageType.Text,
          body,
        },
      });
      await this.prisma.thread.update({
        where: { id: summary.id },
        data: { lastMessageAt: new Date() },
      });
    }
    return summary.id;
  }

  /** After access is approved, lift any pending participant so both can chat. */
  async activateDirectParticipants(companyA: string, companyB: string): Promise<void> {
    const existing = await this.findDirectThread(companyA, companyB);
    if (!existing) {
      return;
    }
    for (const participant of existing.participants) {
      if (
        participant.leftAt ||
        participant.state === ThreadParticipantState.Pending ||
        participant.state === ThreadParticipantState.Archived
      ) {
        await this.prisma.threadParticipant.update({
          where: { id: participant.id },
          data: { state: ThreadParticipantState.Active, leftAt: null },
        });
      }
    }
  }

  /**
   * Find-or-create a direct thread between two trading parties with both
   * participants active. Used when an order is placed so the order card has a home.
   */
  async ensureTradeThread(buyerCompanyId: string, sellerCompanyId: string): Promise<string> {
    const existing = await this.findDirectThread(buyerCompanyId, sellerCompanyId);
    if (existing) {
      for (const participant of existing.participants) {
        if (
          participant.leftAt ||
          participant.state === ThreadParticipantState.Archived ||
          participant.state === ThreadParticipantState.Pending
        ) {
          await this.prisma.threadParticipant.update({
            where: { id: participant.id },
            data: { state: ThreadParticipantState.Active, leftAt: null },
          });
        }
      }
      return existing.id;
    }
    const thread = await this.prisma.thread.create({
      data: {
        type: ThreadType.Direct,
        visibility: ThreadVisibility.Shared,
        createdByCompanyId: buyerCompanyId,
        participants: {
          create: [
            { companyId: buyerCompanyId, state: ThreadParticipantState.Active },
            { companyId: sellerCompanyId, state: ThreadParticipantState.Active },
          ],
        },
      },
    });
    return thread.id;
  }

  findDirectThreadId(a: string, b: string): Promise<string | null> {
    return this.findDirectThread(a, b).then((thread) => thread?.id ?? null);
  }

  private findDirectThread(a: string, b: string) {
    return this.prisma.thread.findFirst({
      where: {
        type: ThreadType.Direct,
        AND: [
          { participants: { some: { companyId: a } } },
          { participants: { some: { companyId: b } } },
        ],
      },
      include: { participants: true },
    });
  }

  private async assertInvitable(actorCompanyId: string, inviteeIds: string[]): Promise<void> {
    const companies = await this.prisma.company.findMany({
      where: { id: { in: inviteeIds } },
      select: { id: true },
    });
    if (companies.length !== inviteeIds.length) {
      throw this.notFound();
    }
    for (const id of inviteeIds) {
      if (!(await this.connectedActive(actorCompanyId, id))) {
        throw new BadRequestException({
          code: 'CONNECTION_REQUIRED',
          message: 'You can only add businesses you are connected with to a group.',
        });
      }
    }
  }

  private async connectedActive(a: string, b: string): Promise<boolean> {
    return (await this.visibility.canViewCatalog(a, b)) || (await this.visibility.canViewCatalog(b, a));
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Conversation not found.' });
  }
}
