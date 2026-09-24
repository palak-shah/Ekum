import { describe, expect, it } from 'vitest';
import { ThreadParticipantState, ThreadVisibility } from '@ekum/domain-types';
import { ThreadService } from './thread.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { AccessService } from '../access/access.service';
import type { ConversationSerializer } from './conversation.serializer';
import type { ReferenceResolver } from './reference-resolver';

interface CreatedData {
  data: { participants: { create: { companyId: string; state: string }[] } } | null;
}

function accessStub(): AccessService {
  return {
    approveIncomingFromCounterpartIfPending: async () => false,
  } as unknown as AccessService;
}

function makeStartDirectService(options: { blocked?: boolean; connected?: boolean }) {
  const created: CreatedData = { data: null };
  const prisma = {
    company: { findUnique: async () => ({ id: 'target' }) },
    thread: {
      findFirst: async () => null,
      create: async (args: { data: CreatedData['data'] }) => {
        created.data = args.data;
        return { id: 't1' };
      },
      findUnique: async () => ({
        id: 't1',
        type: 'direct',
        visibility: 'shared',
        title: null,
        lastMessageAt: new Date(),
        participants: [
          {
            id: 'p-me',
            companyId: 'me',
            state: 'active',
            alertLevel: 'all',
            lastReadAt: null,
            leftAt: null,
            company: { id: 'me' },
          },
        ],
      }),
    },
    threadParticipant: { update: async () => ({}) },
    threadMember: {
      createMany: async () => ({}),
      updateMany: async () => ({}),
      findUnique: async () => null,
      findMany: async () => [],
    },
    companyMembership: { findMany: async () => [] },
    user: { findUnique: async () => ({ name: 'Me' }) },
    message: { count: async () => 0, findMany: async () => [] },
  } as unknown as PrismaService;

  const visibility = {
    isBlocked: async () => options.blocked ?? false,
    canViewCatalog: async () => options.connected ?? false,
  } as unknown as VisibilityService;
  const serializer = {
    toThreadSummary: () => ({ id: 't1' }),
  } as unknown as ConversationSerializer;
  const references = { resolve: async () => new Map() } as unknown as ReferenceResolver;

  return {
    service: new ThreadService(prisma, visibility, serializer, references, accessStub()),
    created,
  };
}

function targetState(created: CreatedData): string | undefined {
  return created.data?.participants.create.find((p) => p.companyId === 'target')?.state;
}

describe('ThreadService.startDirect request gating', () => {
  it('opens a pending request to an unconnected business', async () => {
    const { service, created } = makeStartDirectService({ connected: false });
    const result = await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.Shared,
    });
    expect(targetState(created)).toBe(ThreadParticipantState.Pending);
    expect(result.opened).toBe('created');
  });

  it('opens an active thread with a connected business', async () => {
    const { service, created } = makeStartDirectService({ connected: true });
    await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.Shared,
    });
    expect(targetState(created)).toBe(ThreadParticipantState.Active);
  });

  it('silently archives the recipient when it has blocked the sender', async () => {
    const { service, created } = makeStartDirectService({ blocked: true });
    await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.Shared,
    });
    expect(targetState(created)).toBe(ThreadParticipantState.Archived);
  });
});

describe('ThreadService.membershipOrThrow owner_only visibility', () => {
  function serviceWith(visibility: string) {
    const prisma = {
      threadParticipant: {
        findUnique: async () => ({ id: 'p', state: 'active', leftAt: null, thread: { visibility } }),
      },
    } as unknown as PrismaService;
    return new ThreadService(
      prisma,
      {} as VisibilityService,
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      accessStub(),
    );
  }

  it('hides an owner_only thread from staff', async () => {
    const service = serviceWith(ThreadVisibility.OwnerOnly);
    await expect(service.membershipOrThrow('t', 'me', 'staff')).rejects.toThrow();
  });

  it('lets the owner into an owner_only thread', async () => {
    const service = serviceWith(ThreadVisibility.OwnerOnly);
    await expect(service.membershipOrThrow('t', 'me', 'owner')).resolves.toMatchObject({ id: 'p' });
  });

  it('lets staff into a shared thread', async () => {
    const service = serviceWith(ThreadVisibility.Shared);
    await expect(service.membershipOrThrow('t', 'me', 'staff')).resolves.toMatchObject({ id: 'p' });
  });
});

describe('ThreadService.findDirectThread one 1:1', () => {
  it('reuses the shared shop chat even if the client asks for owner_only', async () => {
    const created: { id?: string } = {};
    const prisma = {
      company: { findUnique: async () => ({ id: 'target' }) },
      thread: {
        findFirst: async () => ({
          id: 'shared-1',
          participants: [{ companyId: 'me', leftAt: null, state: 'active' }],
        }),
        create: async (args: { data: { id?: string } }) => {
          created.id = 'new';
          return args.data;
        },
        findUnique: async () => ({
          id: 'shared-1',
          type: 'direct',
          visibility: ThreadVisibility.Shared,
          title: null,
          lastMessageAt: new Date(),
          participants: [
            {
              id: 'p-me',
              companyId: 'me',
              state: 'active',
              alertLevel: 'all',
              lastReadAt: null,
              leftAt: null,
              company: { id: 'me' },
            },
          ],
        }),
      },
      threadParticipant: { update: async () => ({}) },
      threadMember: {
        createMany: async () => ({}),
        updateMany: async () => ({}),
        findUnique: async () => ({ state: 'active', companyId: 'me' }),
        findMany: async () => [],
      },
      companyMembership: { findMany: async () => [] },
      user: { findUnique: async () => ({ name: 'Me' }) },
      message: { count: async () => 0, findMany: async () => [] },
    } as unknown as PrismaService;

    const service = new ThreadService(
      prisma,
      { isBlocked: async () => false, canViewCatalog: async () => true } as VisibilityService,
      { toThreadSummary: () => ({ id: 'shared-1' }) } as ConversationSerializer,
      { resolve: async () => new Map() } as ReferenceResolver,
      accessStub(),
    );

    const result = await service.startDirect('me', 'owner', {
      companyId: 'target',
      visibility: ThreadVisibility.OwnerOnly,
      memberUserIds: [],
    }, 'user-1');

    expect(result).toEqual({ id: 'shared-1', opened: 'existing' });
    expect(created.id).toBeUndefined();
  });
});

describe('ThreadService.ensureTradeLaneGroup', () => {
  it('reuses an existing trio by company set and does not create another', async () => {
    let created = 0;
    const prisma = {
      thread: {
        findUnique: async () => null,
        findMany: async () => [
          {
            id: 'trio-1',
            type: 'group',
            participants: [
              { id: 'p1', companyId: 'trader', leftAt: null, state: 'active' },
              { id: 'p2', companyId: 'mill', leftAt: null, state: 'active' },
              { id: 'p3', companyId: 'buyer', leftAt: null, state: 'active' },
            ],
          },
        ],
        create: async () => {
          created += 1;
          return { id: 'new' };
        },
      },
      threadParticipant: { update: async () => ({}) },
      company: { findMany: async () => [] },
      threadMember: { createMany: async () => ({}), findMany: async () => [] },
      companyMembership: { findMany: async () => [] },
    } as unknown as PrismaService;

    const service = new ThreadService(
      prisma,
      { isBlocked: async () => false, canViewCatalog: async () => true } as VisibilityService,
      { toThreadSummary: () => ({ id: 'x' }) } as ConversationSerializer,
      { resolve: async () => new Map() } as ReferenceResolver,
      accessStub(),
    );

    const id = await service.ensureTradeLaneGroup('trader', 'mill', 'buyer', null);
    expect(id).toBe('trio-1');
    expect(created).toBe(0);
  });

  it('returns stored groupThreadId when still a group', async () => {
    const prisma = {
      thread: {
        findUnique: async () => ({
          id: 'stored',
          type: 'group',
          participants: [
            { id: 'p1', companyId: 'trader', leftAt: null, state: 'active' },
            { id: 'p2', companyId: 'mill', leftAt: null, state: 'active' },
            { id: 'p3', companyId: 'buyer', leftAt: null, state: 'active' },
          ],
        }),
        findMany: async () => [],
        create: async () => ({ id: 'should-not' }),
      },
      threadParticipant: { update: async () => ({}) },
      company: { findMany: async () => [] },
      threadMember: { createMany: async () => ({}), findMany: async () => [] },
      companyMembership: { findMany: async () => [] },
    } as unknown as PrismaService;

    const service = new ThreadService(
      prisma,
      { isBlocked: async () => false, canViewCatalog: async () => true } as VisibilityService,
      { toThreadSummary: () => ({ id: 'x' }) } as ConversationSerializer,
      { resolve: async () => new Map() } as ReferenceResolver,
      accessStub(),
    );

    await expect(service.ensureTradeLaneGroup('trader', 'mill', 'buyer', 'stored')).resolves.toBe(
      'stored',
    );
  });
});

describe('ThreadService.ensureTradeThread', () => {
  it('heals ThreadMember rows when reusing a participant-only thread', async () => {
    let createManyCalls = 0;
    const prisma = {
      thread: {
        findFirst: async () => ({
          id: 'legacy-1',
          participants: [
            { id: 'p1', companyId: 'buyer', leftAt: null, state: 'active' },
            { id: 'p2', companyId: 'seller', leftAt: null, state: 'active' },
          ],
        }),
        create: async () => ({ id: 'should-not' }),
      },
      threadParticipant: { update: async () => ({}) },
      threadMember: {
        createMany: async () => {
          createManyCalls += 1;
        },
        updateMany: async () => ({}),
      },
      companyMembership: {
        findMany: async ({ where }: { where: { companyId: string } }) =>
          where.companyId === 'buyer'
            ? [{ userId: 'u-buyer' }]
            : [{ userId: 'u-seller' }],
      },
    } as unknown as PrismaService;

    const service = new ThreadService(
      prisma,
      { isBlocked: async () => false, canViewCatalog: async () => true } as VisibilityService,
      { toThreadSummary: () => ({ id: 'x' }) } as ConversationSerializer,
      { resolve: async () => new Map() } as ReferenceResolver,
      accessStub(),
    );

    await expect(service.ensureTradeThread('buyer', 'seller')).resolves.toBe('legacy-1');
    expect(createManyCalls).toBe(2);
  });
});

describe('ThreadService.applyInboxActions (our shop only)', () => {
  function makeService() {
    const hidden: { inboxHiddenAt: Date | null; pinnedAt: Date | null } = {
      inboxHiddenAt: null,
      pinnedAt: new Date(),
    };
    const hides: Array<{ companyId: string; messageId: string }> = [];
    const otherHidden = { inboxHiddenAt: null as Date | null };
    const lastRead: { at: Date | null } = { at: new Date() };
    const prisma = {
      threadParticipant: {
        findUnique: async () => ({
          id: 'p-me',
          state: 'active',
          leftAt: null,
          thread: { visibility: 'shared' },
        }),
        update: async (args: {
          data: { inboxHiddenAt?: Date | null; pinnedAt?: Date | null; lastReadAt?: Date };
        }) => {
          if ('inboxHiddenAt' in args.data) hidden.inboxHiddenAt = args.data.inboxHiddenAt ?? null;
          if ('pinnedAt' in args.data) hidden.pinnedAt = args.data.pinnedAt ?? null;
          if (args.data.lastReadAt) lastRead.at = args.data.lastReadAt;
          return {};
        },
      },
      threadMember: {
        findUnique: async () => ({
          state: 'active',
          companyId: 'me',
        }),
      },
      message: {
        findMany: async () => [{ id: 'm1' }, { id: 'm2' }],
        findFirst: async () => ({ createdAt: new Date('2026-09-23T12:00:00.000Z') }),
      },
      messageHide: {
        createMany: async (args: { data: Array<{ companyId: string; messageId: string }> }) => {
          hides.push(...args.data);
          return { count: args.data.length };
        },
      },
    } as unknown as PrismaService;
    const service = new ThreadService(
      prisma,
      {} as VisibilityService,
      {} as ConversationSerializer,
      {} as ReferenceResolver,
      accessStub(),
    );
    return { service, hidden, hides, otherHidden, lastRead };
  }

  it('archives the row without hiding messages or touching the other shop', async () => {
    const { service, hidden, hides } = makeService();
    const result = await service.applyInboxActions(
      'me',
      'owner',
      { action: 'archive', threadIds: ['t1'] },
      'u1',
    );
    expect(result).toEqual({ ok: true, count: 1 });
    expect(hidden.inboxHiddenAt).toBeInstanceOf(Date);
    expect(hidden.pinnedAt).toBeNull();
    expect(hides).toHaveLength(0);
  });

  it('clears history for our company only', async () => {
    const { service, hidden, hides } = makeService();
    await service.applyInboxActions('me', 'owner', { action: 'clear', threadIds: ['t1'] }, 'u1');
    expect(hidden.inboxHiddenAt).toBeNull();
    expect(hides).toEqual([
      { companyId: 'me', messageId: 'm1' },
      { companyId: 'me', messageId: 'm2' },
    ]);
  });

  it('delete hides messages and the row for us', async () => {
    const { service, hidden, hides } = makeService();
    await service.applyInboxActions('me', 'owner', { action: 'delete', threadIds: ['t1'] }, 'u1');
    expect(hidden.inboxHiddenAt).toBeInstanceOf(Date);
    expect(hides).toHaveLength(2);
  });

  it('unarchives without hiding messages', async () => {
    const { service, hidden, hides } = makeService();
    hidden.inboxHiddenAt = new Date();
    await service.applyInboxActions('me', 'owner', { action: 'unarchive', threadIds: ['t1'] }, 'u1');
    expect(hidden.inboxHiddenAt).toBeNull();
    expect(hides).toHaveLength(0);
  });

  it('marks unread just before the last inbound message', async () => {
    const { service, lastRead } = makeService();
    await service.applyInboxActions('me', 'owner', { action: 'unread', threadIds: ['t1'] }, 'u1');
    expect(lastRead.at?.toISOString()).toBe('2026-09-23T11:59:59.999Z');
  });
});
