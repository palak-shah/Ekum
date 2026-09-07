import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Thread, type ThreadParticipant } from '@prisma/client';
import {
  MAX_PINNED_THREADS,
  MembershipRole,
  MessageType,
  ThreadMemberState,
  ThreadParticipantState,
  ThreadType,
  ThreadVisibility,
  type AddParticipantsDto,
  type CreateGroupThreadDto,
  type CursorPage,
  type ListThreadsQuery,
  type MessageView,
  type SetAlertLevelDto,
  type SetThreadMembersDto,
  type SetThreadPinnedDto,
  type StartDirectThreadDto,
  type StartDirectThreadResult,
  type ThreadDetail,
  type ThreadPersonView,
  type ThreadSummary,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { ConversationSerializer } from './conversation.serializer';
import { ReferenceResolver } from './reference-resolver';
import { findThreadSearchHits, threadSurfaceMatchesQ } from './message-search';
import { messageVisibleToCompany } from './side-message';
import { scrubOrderMessageView } from '../orders/i-handle-soft-hide';
import {
  countedPeopleForCompany,
  lastOwnerMute,
  ownerOnlyRoster,
  peopleFingerprint,
  sameChatConflict,
  seedOwnersAndStaff,
} from './thread-roster';

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
    userId: string | null = null,
  ): Promise<MembershipWithThread> {
    const participant = await this.prisma.threadParticipant.findUnique({
      where: { threadId_companyId: { threadId, companyId } },
      include: { thread: true },
    });
    if (!participant || participant.leftAt || participant.state === ThreadParticipantState.Archived) {
      throw this.notFound();
    }
    if (userId) {
      const member = await this.prisma.threadMember.findUnique({
        where: { threadId_userId: { threadId, userId } },
      });
      const onThread = member?.state === ThreadMemberState.Active && member.companyId === companyId;
      if (!onThread) {
        throw this.notFound();
      }
    } else if (
      participant.thread.visibility === ThreadVisibility.OwnerOnly &&
      role !== MembershipRole.Owner
    ) {
      throw this.notFound();
    }
    return participant;
  }

  async startDirect(
    actorCompanyId: string,
    role: string | null,
    dto: StartDirectThreadDto,
    viewerUserId: string | null = null,
  ): Promise<StartDirectThreadResult> {
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
      const wasArchived =
        mine && (mine.leftAt || mine.state === ThreadParticipantState.Archived);
      if (wasArchived) {
        await this.prisma.threadParticipant.update({
          where: { id: mine.id },
          data: { state: ThreadParticipantState.Active, leftAt: null },
        });
      }
      if (viewerUserId) {
        await seedOwnersAndStaff(this.prisma, existing.id, actorCompanyId, [
          viewerUserId,
          ...(dto.memberUserIds ?? []),
        ]);
      }
      const summary = await this.summaryById(existing.id, actorCompanyId, role, viewerUserId);
      return { ...summary, opened: wasArchived ? 'restored' : 'existing' };
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
        visibility: ThreadVisibility.Shared,
        createdByCompanyId: actorCompanyId,
        participants: {
          create: [
            { companyId: actorCompanyId, state: ThreadParticipantState.Active },
            { companyId: dto.companyId, state: targetState, invitedBy: actorCompanyId },
          ],
        },
      },
    });
    await seedOwnersAndStaff(this.prisma, thread.id, actorCompanyId, [
      ...(viewerUserId ? [viewerUserId] : []),
      ...(dto.memberUserIds ?? []),
    ]);
    if (targetState !== ThreadParticipantState.Archived) {
      await seedOwnersAndStaff(this.prisma, thread.id, dto.companyId, []);
    }
    return { ...(await this.summaryById(thread.id, actorCompanyId, role, viewerUserId)), opened: 'created' };
  }

  async createGroup(
    actorCompanyId: string,
    role: string | null,
    dto: CreateGroupThreadDto,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    const inviteeIds = [...new Set(dto.participantCompanyIds)].filter((id) => id !== actorCompanyId);
    if (inviteeIds.length === 0) {
      throw new BadRequestException({
        code: 'NO_PARTICIPANTS',
        message: 'A group needs at least one other business.',
      });
    }
    await this.assertInvitable(actorCompanyId, inviteeIds);

    const wantedPeople = peopleFingerprint([
      ...(viewerUserId ? [viewerUserId] : []),
      ...(dto.memberUserIds ?? []),
      ...(await this.ownerIds(actorCompanyId)),
    ]);
    const clone = await this.findGroupByFingerprint(actorCompanyId, inviteeIds, wantedPeople);
    if (clone) {
      const mine = clone.participants.find((p) => p.companyId === actorCompanyId);
      if (mine && (mine.leftAt || mine.state === ThreadParticipantState.Archived)) {
        await this.prisma.threadParticipant.update({
          where: { id: mine.id },
          data: { state: ThreadParticipantState.Active, leftAt: null },
        });
      }
      throw sameChatConflict(clone.id, clone.title);
    }

    const thread = await this.prisma.thread.create({
      data: {
        type: ThreadType.Group,
        visibility: ThreadVisibility.Shared,
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
    await seedOwnersAndStaff(this.prisma, thread.id, actorCompanyId, [
      ...(viewerUserId ? [viewerUserId] : []),
      ...(dto.memberUserIds ?? []),
    ]);
    for (const id of inviteeIds) {
      await seedOwnersAndStaff(this.prisma, thread.id, id, []);
    }
    return this.detail(thread.id, actorCompanyId, role, viewerUserId);
  }

  async list(
    actorCompanyId: string,
    _role: string | null,
    query: ListThreadsQuery,
    viewerUserId: string | null = null,
  ): Promise<CursorPage<ThreadSummary>> {
    const where: Prisma.ThreadParticipantWhereInput = {
      companyId: actorCompanyId,
      state: query.state ?? ThreadParticipantState.Active,
      leftAt: null,
      ...(viewerUserId
        ? {
            thread: {
              members: {
                some: {
                  userId: viewerUserId,
                  companyId: actorCompanyId,
                  state: ThreadMemberState.Active,
                },
              },
            },
          }
        : {}),
    };

    const q = query.q?.trim() || '';
    const deepHits = q ? await findThreadSearchHits(this.prisma, actorCompanyId, q) : new Map();

    if (q) {
      // Surface (name/title/city) + deep message hits. Cap scan for trader-scale inboxes.
      const candidates = await this.prisma.threadParticipant.findMany({
        where,
        include: { thread: { include: { participants: { include: { company: true } } } } },
        orderBy: [
          { pinnedAt: { sort: 'desc', nulls: 'last' } },
          { thread: { lastMessageAt: 'desc' } },
          { id: 'desc' },
        ],
        take: 200,
      });

      const matched = candidates.filter((participant) => {
        const counterpart =
          participant.thread.type === ThreadType.Direct
            ? participant.thread.participants.find((p) => p.companyId !== actorCompanyId)?.company
            : undefined;
        const surface = threadSurfaceMatchesQ({
          title: participant.thread.title,
          counterpartName: counterpart?.name,
          counterpartCity: counterpart?.city,
          q,
        });
        return surface || deepHits.has(participant.threadId);
      });

      const hasMore = matched.length > query.limit;
      const pageRows = hasMore ? matched.slice(0, query.limit) : matched;
      const last = pageRows[pageRows.length - 1];

      const results = await Promise.all(
        pageRows.map(async (participant) => {
          const [unreadCount, lastMessage] = await Promise.all([
            this.unreadCount(participant.threadId, actorCompanyId, participant.lastReadAt),
            this.lastMessageView(participant.threadId, actorCompanyId, viewerUserId),
          ]);
          const counterpart =
            participant.thread.type === ThreadType.Direct
              ? participant.thread.participants.find((p) => p.companyId !== actorCompanyId)?.company
              : undefined;
          const surface = threadSurfaceMatchesQ({
            title: participant.thread.title,
            counterpartName: counterpart?.name,
            counterpartCity: counterpart?.city,
            q,
          });
          const deep = !surface ? deepHits.get(participant.threadId) : undefined;
          return this.serializer.toThreadSummary({
            thread: participant.thread,
            participants: participant.thread.participants,
            mine: participant,
            unreadCount,
            lastMessage,
            searchHitPreview: deep?.preview ?? null,
            searchHitMessageId: deep?.messageId ?? null,
          });
        }),
      );

      return { results, nextCursor: hasMore && last ? last.id : null };
    }

    const rows = await this.prisma.threadParticipant.findMany({
      where,
      include: { thread: { include: { participants: { include: { company: true } } } } },
      orderBy: [
        { pinnedAt: { sort: 'desc', nulls: 'last' } },
        { thread: { lastMessageAt: 'desc' } },
        { id: 'desc' },
      ],
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
          this.lastMessageView(participant.threadId, actorCompanyId, viewerUserId),
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

  get(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    return this.detail(threadId, actorCompanyId, role, viewerUserId);
  }

  async markRead(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
    await this.prisma.threadParticipant.update({
      where: { id: mine.id },
      data: { lastReadAt: new Date() },
    });
    return this.detail(threadId, actorCompanyId, role, viewerUserId);
  }

  /** Clears unread on every chat the company still belongs to. */
  async markAllRead(actorCompanyId: string): Promise<{ ok: true }> {
    await this.prisma.threadParticipant.updateMany({
      where: { companyId: actorCompanyId, leftAt: null },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  }

  /**
   * Total unread messages across Active threads only (not Requests).
   * Used by the bottom-nav Chats badge.
   */
  async unreadTotal(
    actorCompanyId: string,
    _role: string | null,
    viewerUserId: string | null = null,
  ): Promise<{ count: number }> {
    const where: Prisma.ThreadParticipantWhereInput = {
      companyId: actorCompanyId,
      state: ThreadParticipantState.Active,
      leftAt: null,
      ...(viewerUserId
        ? {
            thread: {
              members: {
                some: {
                  userId: viewerUserId,
                  companyId: actorCompanyId,
                  state: ThreadMemberState.Active,
                },
              },
            },
          }
        : {}),
    };

    const participants = await this.prisma.threadParticipant.findMany({
      where,
      select: { threadId: true, lastReadAt: true },
    });
    if (participants.length === 0) {
      return { count: 0 };
    }

    const counts = await Promise.all(
      participants.map((row) =>
        this.unreadCount(row.threadId, actorCompanyId, row.lastReadAt),
      ),
    );
    return { count: counts.reduce((sum, n) => sum + n, 0) };
  }

  async setAlertLevel(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    dto: SetAlertLevelDto,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
    if (viewerUserId) {
      await this.prisma.threadMember.updateMany({
        where: { threadId, userId: viewerUserId, companyId: actorCompanyId },
        data: { alertLevel: dto.alertLevel },
      });
    } else {
      const mine = await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
      await this.prisma.threadParticipant.update({
        where: { id: mine.id },
        data: { alertLevel: dto.alertLevel },
      });
    }
    return this.detail(threadId, actorCompanyId, role, viewerUserId);
  }

  async setPinned(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    dto: SetThreadPinnedDto,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
    if (dto.pinned) {
      if (!mine.pinnedAt) {
        const pinnedCount = await this.prisma.threadParticipant.count({
          where: {
            companyId: actorCompanyId,
            leftAt: null,
            pinnedAt: { not: null },
          },
        });
        if (pinnedCount >= MAX_PINNED_THREADS) {
          throw new BadRequestException({
            code: 'PIN_LIMIT',
            message: `You can pin up to ${MAX_PINNED_THREADS} chats.`,
          });
        }
      }
      await this.prisma.threadParticipant.update({
        where: { id: mine.id },
        data: { pinnedAt: mine.pinnedAt ?? new Date() },
      });
    } else {
      await this.prisma.threadParticipant.update({
        where: { id: mine.id },
        data: { pinnedAt: null },
      });
    }
    return this.detail(threadId, actorCompanyId, role, viewerUserId);
  }

  async accept(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
    if (mine.state === ThreadParticipantState.Pending) {
      await this.prisma.threadParticipant.update({
        where: { id: mine.id },
        data: { state: ThreadParticipantState.Active },
      });
    }
    return this.detail(threadId, actorCompanyId, role, viewerUserId);
  }

  async decline(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    viewerUserId: string | null = null,
  ): Promise<{ ok: true }> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
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
    viewerUserId: string,
  ): Promise<{ ok: true }> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
    if (mine.thread.type === ThreadType.Direct && role === MembershipRole.Owner) {
      const activeOwners = await this.prisma.threadMember.count({
        where: {
          threadId,
          companyId: actorCompanyId,
          state: ThreadMemberState.Active,
          userId: {
            in: await this.ownerIds(actorCompanyId),
          },
        },
      });
      if (activeOwners <= 1) {
        throw lastOwnerMute();
      }
    }
    await this.prisma.threadMember.update({
      where: { threadId_userId: { threadId, userId: viewerUserId } },
      data: { state: ThreadMemberState.Left, leftAt: new Date() },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: viewerUserId },
      select: { name: true },
    });
    const name = user?.name?.trim() || 'Someone';
    await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: actorCompanyId,
        senderUserId: viewerUserId,
        senderName: name,
        type: MessageType.System,
        body: `${name} left this chat.`,
        metadata: { side: 'company', companyId: actorCompanyId } as Prisma.InputJsonValue,
      },
    });
    return { ok: true };
  }

  async archiveGroup(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    viewerUserId: string | null = null,
  ): Promise<{ ok: true }> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
    if (mine.thread.type !== ThreadType.Group) {
      throw new BadRequestException({
        code: 'NOT_A_GROUP',
        message: 'Use mute on a shop chat. You cannot remove it.',
      });
    }
    if (role !== MembershipRole.Owner) {
      throw ownerOnlyRoster();
    }
    await this.prisma.threadParticipant.update({
      where: { id: mine.id },
      data: { state: ThreadParticipantState.Archived, leftAt: new Date() },
    });
    return { ok: true };
  }

  async addMembers(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    dto: SetThreadMembersDto,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    if (role !== MembershipRole.Owner) throw ownerOnlyRoster();
    await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
    const nextPeople = peopleFingerprint([
      ...(await countedPeopleForCompany(this.prisma, threadId, actorCompanyId)),
      ...dto.userIds,
    ]);
    await this.assertPeopleClone(threadId, actorCompanyId, nextPeople);
    await seedOwnersAndStaff(this.prisma, threadId, actorCompanyId, dto.userIds);
    return this.detail(threadId, actorCompanyId, role, viewerUserId);
  }

  async removeMembers(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    dto: SetThreadMembersDto,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    if (role !== MembershipRole.Owner) throw ownerOnlyRoster();
    await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
    const current = await countedPeopleForCompany(this.prisma, threadId, actorCompanyId);
    const nextPeople = peopleFingerprint(current.filter((id) => !dto.userIds.includes(id)));
    await this.assertPeopleClone(threadId, actorCompanyId, nextPeople);
    await this.prisma.threadMember.updateMany({
      where: { threadId, companyId: actorCompanyId, userId: { in: dto.userIds } },
      data: { state: ThreadMemberState.Removed, leftAt: new Date() },
    });
    return this.detail(threadId, actorCompanyId, role, viewerUserId);
  }

  async addParticipants(
    actorCompanyId: string,
    role: string | null,
    threadId: string,
    dto: AddParticipantsDto,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    const mine = await this.membershipOrThrow(threadId, actorCompanyId, role, viewerUserId);
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
      return this.detail(threadId, actorCompanyId, role, viewerUserId);
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
    for (const id of inviteeIds) {
      await seedOwnersAndStaff(this.prisma, threadId, id, []);
    }
    return this.detail(threadId, actorCompanyId, role, viewerUserId);
  }

  async summaryById(
    threadId: string,
    actorCompanyId: string,
    role: string | null,
    viewerUserId: string | null = null,
  ): Promise<ThreadSummary> {
    const { thread, participants, mine } = await this.loadForViewer(
      threadId,
      actorCompanyId,
      role,
      viewerUserId,
    );
    const [unreadCount, lastMessage] = await Promise.all([
      this.unreadCount(threadId, actorCompanyId, mine.lastReadAt),
      this.lastMessageView(threadId, actorCompanyId, viewerUserId),
    ]);
    return this.serializer.toThreadSummary({ thread, participants, mine, unreadCount, lastMessage });
  }

  private async detail(
    threadId: string,
    actorCompanyId: string,
    role: string | null,
    viewerUserId: string | null = null,
  ): Promise<ThreadDetail> {
    const { thread, participants, mine } = await this.loadForViewer(
      threadId,
      actorCompanyId,
      role,
      viewerUserId,
    );
    const [unreadCount, lastMessage] = await Promise.all([
      this.unreadCount(threadId, actorCompanyId, mine.lastReadAt),
      this.lastMessageView(threadId, actorCompanyId, viewerUserId),
    ]);
    const extras = await this.detailExtras(threadId, actorCompanyId, role, viewerUserId, thread.type);
    return this.serializer.toThreadDetail({
      thread,
      participants,
      mine,
      unreadCount,
      lastMessage,
      ...extras,
    });
  }

  private async loadForViewer(
    threadId: string,
    actorCompanyId: string,
    role: string | null,
    viewerUserId: string | null = null,
  ) {
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
    if (viewerUserId) {
      const member = await this.prisma.threadMember.findUnique({
        where: { threadId_userId: { threadId, userId: viewerUserId } },
      });
      if (!member || member.state !== ThreadMemberState.Active || member.companyId !== actorCompanyId) {
        throw this.notFound();
      }
    } else if (thread.visibility === ThreadVisibility.OwnerOnly && role !== MembershipRole.Owner) {
      throw this.notFound();
    }
    return { thread, participants: thread.participants, mine };
  }

  private async lastMessageView(
    threadId: string,
    viewerCompanyId: string,
    viewerUserId: string | null = null,
  ): Promise<MessageView | null> {
    const recent = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const message = recent.find((row) => messageVisibleToCompany(row, viewerCompanyId));
    if (!message) {
      return null;
    }
    const references = await this.references.resolve([message], viewerCompanyId);
    return scrubOrderMessageView(
      this.serializer.toMessageView(
        message,
        viewerCompanyId,
        viewerUserId,
        references.get(message.id) ?? null,
      ),
    );
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
    await seedOwnersAndStaff(this.prisma, thread.id, buyerCompanyId, []);
    await seedOwnersAndStaff(this.prisma, thread.id, sellerCompanyId, []);
    return thread.id;
  }

  findDirectThreadId(a: string, b: string): Promise<string | null> {
    return this.findDirectThread(a, b).then((thread) => thread?.id ?? null);
  }

  async nudgeArchivedRecipients(threadId: string, senderCompanyId: string): Promise<string[]> {
    const others = await this.prisma.threadParticipant.findMany({
      where: {
        threadId,
        companyId: { not: senderCompanyId },
        state: ThreadParticipantState.Archived,
      },
    });
    const notified: string[] = [];
    for (const row of others) {
      if (await this.visibility.isBlocked(senderCompanyId, row.companyId)) {
        continue;
      }
      await this.prisma.threadParticipant.update({
        where: { id: row.id },
        data: { state: ThreadParticipantState.Pending, leftAt: null },
      });
      await seedOwnersAndStaff(this.prisma, threadId, row.companyId, []);
      notified.push(...(await this.ownerIds(row.companyId)));
    }
    return notified;
  }

  async notifyUserIdsForMessage(
    threadId: string,
    senderCompanyId: string,
  ): Promise<{ companyIds: string[]; userIds: string[] }> {
    const others = await this.prisma.threadParticipant.findMany({
      where: {
        threadId,
        companyId: { not: senderCompanyId },
        state: { in: [ThreadParticipantState.Active, ThreadParticipantState.Pending] },
        leftAt: null,
      },
      select: { companyId: true, state: true },
    });
    const companyIds = others.map((row) => row.companyId);
    const members = await this.prisma.threadMember.findMany({
      where: {
        threadId,
        companyId: { in: companyIds },
        state: ThreadMemberState.Active,
        alertLevel: { not: 'muted' },
      },
      select: { userId: true, companyId: true },
    });
    const pendingCompanies = new Set(
      others.filter((row) => row.state === ThreadParticipantState.Pending).map((row) => row.companyId),
    );
    const ownerSet = new Set<string>();
    for (const companyId of pendingCompanies) {
      for (const id of await this.ownerIds(companyId)) ownerSet.add(id);
    }
    const userIds = [
      ...new Set([
        ...members.map((m) => m.userId),
        ...[...ownerSet],
      ]),
    ];
    return { companyIds, userIds };
  }

  private async detailExtras(
    threadId: string,
    actorCompanyId: string,
    role: string | null,
    viewerUserId: string | null,
    type: string,
  ): Promise<{
    people: ThreadPersonView[];
    canLeave: boolean;
    canRemoveGroup: boolean;
    canManagePeople: boolean;
    alertLevel: string;
  }> {
    const peopleRows = await this.prisma.threadMember.findMany({
      where: { threadId, companyId: actorCompanyId, state: ThreadMemberState.Active },
      include: { user: { select: { id: true, name: true } } },
    });
    const memberships = await this.prisma.companyMembership.findMany({
      where: { companyId: actorCompanyId, userId: { in: peopleRows.map((r) => r.userId) } },
      select: { userId: true, role: true },
    });
    const roleByUser = new Map(memberships.map((m) => [m.userId, m.role]));
    const people: ThreadPersonView[] = peopleRows.map((row) => ({
      userId: row.userId,
      name: row.user.name?.trim() || 'Team',
      role: roleByUser.get(row.userId) ?? 'staff',
      state: row.state,
    }));
    let canLeave = Boolean(viewerUserId);
    if (canLeave && type === ThreadType.Direct && role === MembershipRole.Owner) {
      const owners = await this.ownerIds(actorCompanyId);
      const activeOwners = peopleRows.filter((row) => owners.includes(row.userId)).length;
      canLeave = activeOwners > 1;
    }
    const mineMember = viewerUserId
      ? peopleRows.find((row) => row.userId === viewerUserId)
      : undefined;
    return {
      people,
      canLeave,
      canRemoveGroup: type === ThreadType.Group && role === MembershipRole.Owner,
      canManagePeople: role === MembershipRole.Owner,
      alertLevel: mineMember?.alertLevel ?? 'all',
    };
  }

  private async ownerIds(companyId: string): Promise<string[]> {
    const rows = await this.prisma.companyMembership.findMany({
      where: { companyId, role: MembershipRole.Owner, archivedAt: null },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  private async assertPeopleClone(
    threadId: string,
    actorCompanyId: string,
    nextPeopleKey: string,
  ): Promise<void> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { participants: true },
    });
    if (!thread || thread.type !== ThreadType.Group) return;
    const others = thread.participants
      .map((p) => p.companyId)
      .filter((id) => id !== actorCompanyId);
    const hit = await this.findGroupByFingerprint(actorCompanyId, others, nextPeopleKey, threadId);
    if (hit) throw sameChatConflict(hit.id, hit.title);
  }

  private async findGroupByFingerprint(
    actorCompanyId: string,
    otherCompanyIds: string[],
    peopleKey: string,
    exceptThreadId?: string,
  ) {
    const wanted = new Set([actorCompanyId, ...otherCompanyIds]);
    const candidates = await this.prisma.thread.findMany({
      where: {
        type: ThreadType.Group,
        ...(exceptThreadId ? { id: { not: exceptThreadId } } : {}),
        AND: [...wanted].map((companyId) => ({
          participants: { some: { companyId } },
        })),
      },
      include: { participants: true },
    });
    for (const candidate of candidates) {
      const ids = new Set(candidate.participants.map((p) => p.companyId));
      if (ids.size !== wanted.size) continue;
      const people = peopleFingerprint(
        await countedPeopleForCompany(this.prisma, candidate.id, actorCompanyId),
      );
      if (people === peopleKey) return candidate;
    }
    return null;
  }

  private async findDirectThread(a: string, b: string) {
    const pair = {
      type: ThreadType.Direct,
      AND: [
        { participants: { some: { companyId: a } } },
        { participants: { some: { companyId: b } } },
      ],
    };
    const shared = await this.prisma.thread.findFirst({
      where: { ...pair, visibility: ThreadVisibility.Shared },
      include: { participants: true },
    });
    if (shared) return shared;
    return this.prisma.thread.findFirst({
      where: pair,
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
