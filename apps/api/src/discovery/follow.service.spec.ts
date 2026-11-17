import { describe, expect, it, vi } from 'vitest';
import { FollowService } from './follow.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { ThreadService } from '../conversation/thread.service';
import type { DiscoverySerializer } from './discovery.serializer';
import type { DomainEvents } from '../events/events.module';

/** Stub ThreadService — FollowService requires it (Accept follow must not silently skip Direct). */
const noopThreads = {
  findDirectThreadId: async () => null,
} as unknown as ThreadService;

const noopEvents = { followAllowed: vi.fn() } as unknown as DomainEvents;

/** Bilateral block check used by Follow Accept → Connection. */
const noBlocks = {
  count: async () => 0,
  findUnique: async () => null,
  deleteMany: async () => ({ count: 0 }),
  findMany: async () => [],
};

function setup(options: {
  target: { id: string } | null;
  blocked: boolean;
  existing?: { status: string } | null;
}) {
  const create = vi.fn(async () => ({}));
  const findUnique = vi.fn(async (args: { where?: { id?: string } }) => {
    if (args.where && 'id' in (args.where as object) === false) {
      return options.existing ?? null;
    }
    return options.existing ?? null;
  });
  const prisma = {
    company: { findUnique: async () => options.target },
    follow: { create, findUnique, deleteMany: vi.fn(), findMany: vi.fn() },
  } as unknown as PrismaService;
  const visibility = { isBlocked: async () => options.blocked } as unknown as VisibilityService;
  const serializer = {} as unknown as DiscoverySerializer;
  return {
    service: new FollowService(prisma, visibility, serializer, noopThreads, noopEvents),
    create,
  };
}

describe('FollowService.follow', () => {
  it('rejects following your own business', async () => {
    const { service, create } = setup({ target: { id: 'me' }, blocked: false });
    await expect(service.follow('me', 'me')).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it('hides a business that has blocked the follower', async () => {
    const { service, create } = setup({ target: { id: 'target' }, blocked: true });
    await expect(service.follow('me', 'target')).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a pending ask', async () => {
    const { service, create } = setup({ target: { id: 'target' }, blocked: false, existing: null });
    await expect(service.follow('me', 'target')).resolves.toEqual({
      following: false,
      pending: true,
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        followerCompanyId: 'me',
        followedCompanyId: 'target',
        status: 'pending',
        accessKind: null,
      },
    });
  });

  it('does not auto-allow when already pending', async () => {
    const { service, create } = setup({
      target: { id: 'target' },
      blocked: false,
      existing: { status: 'pending' },
    });
    await expect(service.follow('me', 'target')).resolves.toEqual({
      following: false,
      pending: true,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns following when already allowed', async () => {
    const { service, create } = setup({
      target: { id: 'target' },
      blocked: false,
      existing: { status: 'allowed', packAskPending: false },
    });
    await expect(service.follow('me', 'target')).resolves.toEqual({
      following: true,
      pending: false,
      packAskPending: false,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('re-asks by turning stopped back to pending', async () => {
    const update = vi.fn(async () => ({}));
    const create = vi.fn(async () => ({}));
    const prisma = {
      company: { findUnique: async () => ({ id: 'target' }) },
      follow: {
        findUnique: async () => ({ id: 'f-stop', status: 'stopped' }),
        create,
        update,
      },
    } as unknown as PrismaService;
    const visibility = { isBlocked: async () => false } as unknown as VisibilityService;
    const service = new FollowService(prisma, visibility, {} as DiscoverySerializer, noopThreads, noopEvents);
    await expect(service.follow('me', 'target')).resolves.toEqual({
      following: false,
      pending: true,
    });
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f-stop' },
      data: { status: 'pending', accessKind: null, packAskPending: false },
    });
  });
});

describe('FollowService.unfollow', () => {
  it('deletes the follow row and keeps Direct Links', async () => {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      follow: {
        deleteMany,
      },
      message: { create: vi.fn() },
      thread: { update: vi.fn() },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
      noopThreads,
      noopEvents,
    );
    await expect(service.unfollow('me', 'shop')).resolves.toEqual({
      following: false,
      pending: false,
    });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { followerCompanyId: 'me', followedCompanyId: 'shop' },
    });
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('does not post Repost-off when unfollowing a Pack mill', async () => {
    const create = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        deleteMany: vi.fn(async () => ({ count: 1 })),
      },
      message: { create },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = {
      findExactPairDirectThreadId: vi.fn(async () => 'thread-1'),
    };
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
      threads as unknown as ThreadService,
    );
    await service.unfollow('trader', 'mill');
    expect(create).not.toHaveBeenCalled();
  });
});

describe('FollowService.decide', () => {
  it('allows look on a pending ask', async () => {
    const update = vi.fn(async () => ({}));
    const connectionUpsert = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f1',
          status: 'pending',
          followerCompanyId: 'me',
          followedCompanyId: 'shop',
        }),
        update,
        delete: vi.fn(),
      },
      companyBlock: noBlocks,
      connection: {
        findUnique: async () => null,
        upsert: connectionUpsert,
      },
    } as unknown as PrismaService;
    const followAllowed = vi.fn();
    const events = { followAllowed } as unknown as DomainEvents;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
      noopThreads,
      events,
    );
    await expect(service.decide('shop', 'me', 'look')).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalled();
    expect(connectionUpsert).toHaveBeenCalled();
    expect(followAllowed).toHaveBeenCalledWith({
      followerCompanyId: 'me',
      shopCompanyId: 'shop',
      accessKind: 'look',
    });
  });

  it('denies a pending ask by deleting the row', async () => {
    const del = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f1',
          status: 'pending',
          followerCompanyId: 'me',
          followedCompanyId: 'shop',
        }),
        delete: del,
        update: vi.fn(),
      },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.decide('shop', 'me', 'deny')).resolves.toEqual({ ok: true });
    expect(del).toHaveBeenCalledWith({ where: { id: 'f1' } });
  });

  it('stops an allowed follow without deleting the row', async () => {
    const update = vi.fn(async () => ({}));
    const del = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f2',
          status: 'allowed',
          packAskPending: false,
          followerCompanyId: 'me',
          followedCompanyId: 'shop',
        }),
        delete: del,
        update,
      },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.decide('shop', 'me', 'deny')).resolves.toEqual({ ok: true });
    expect(del).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f2' },
      data: { status: 'stopped', accessKind: null, packAskPending: false },
    });
  });

  it('allows look again from stopped', async () => {
    const update = vi.fn(async () => ({}));
    const connectionUpsert = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f3',
          status: 'stopped',
          followerCompanyId: 'me',
          followedCompanyId: 'shop',
        }),
        update,
        delete: vi.fn(),
      },
      companyBlock: noBlocks,
      connection: {
        findUnique: async () => null,
        upsert: connectionUpsert,
      },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.decide('shop', 'me', 'look')).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f3' },
      data: { status: 'allowed', accessKind: 'look', packAskPending: false },
    });
    expect(connectionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'active' }),
        update: expect.objectContaining({ status: 'active' }),
      }),
    );
  });

  it('Accept while I blocked them clears my Block then connects', async () => {
    const update = vi.fn(async () => ({}));
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const connectionUpsert = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f-block',
          status: 'pending',
          followerCompanyId: 'me',
          followedCompanyId: 'shop',
        }),
        update,
        delete: vi.fn(),
      },
      companyBlock: {
        findUnique: async () => ({ id: 'cb1' }),
        count: async () => 0,
        deleteMany,
      },
      connection: {
        findUnique: async () => null,
        upsert: connectionUpsert,
      },
      $transaction: async (fn: (tx: unknown) => unknown) =>
        fn({
          companyBlock: {
            deleteMany,
            count: async () => 0,
          },
          connection: {
            findUnique: async () => null,
            update: vi.fn(),
          },
        }),
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
      noopThreads,
      noopEvents,
    );
    await expect(service.decide('shop', 'me', 'look')).resolves.toEqual({ ok: true });
    expect(deleteMany).toHaveBeenCalled();
    expect(connectionUpsert).toHaveBeenCalled();
  });

  it('Follow Accept opens Pending or Ignored Direct', async () => {
    const update = vi.fn(async () => ({}));
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f-msg',
          status: 'pending',
          followerCompanyId: 'me',
          followedCompanyId: 'shop',
        }),
        update,
        delete: vi.fn(),
      },
      companyBlock: noBlocks,
      connection: {
        findUnique: async () => null,
        upsert: vi.fn(async () => ({})),
      },
      threadParticipant: { updateMany },
    } as unknown as PrismaService;
    const threads = {
      findDirectThreadId: vi.fn(async () => 'thread-pending'),
    };
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
      threads as unknown as ThreadService,
      noopEvents,
    );
    await expect(service.decide('shop', 'me', 'look')).resolves.toEqual({ ok: true });
    // Must resolve Direct via ThreadService — never optional-skip Accept → Active.
    expect(threads.findDirectThreadId).toHaveBeenCalledWith('shop', 'me');
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        threadId: 'thread-pending',
        companyId: 'shop',
        state: { in: ['pending', 'archived'] },
      },
      data: { state: 'active', leftAt: null },
    });
  });

  it('Follow Allow does not lift a Blocked connection', async () => {
    const update = vi.fn(async () => ({}));
    const connectionUpsert = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f-block',
          status: 'pending',
          followerCompanyId: 'me',
          followedCompanyId: 'shop',
        }),
        update,
        delete: vi.fn(),
      },
      companyBlock: noBlocks,
      connection: {
        findUnique: async () => ({ status: 'blocked' }),
        upsert: connectionUpsert,
      },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.decide('shop', 'me', 'look')).resolves.toEqual({ ok: true });
    expect(connectionUpsert).not.toHaveBeenCalled();
  });

  it('grants Pack on a Share upgrade without dropping Look', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f-share',
          status: 'allowed',
          packAskPending: true,
          accessKind: 'look',
          followerCompanyId: 'trader',
          followedCompanyId: 'mill',
        }),
        update,
        delete: vi.fn(),
      },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.decide('mill', 'trader', 'pack')).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f-share' },
      data: { accessKind: 'pack', packAskPending: false },
    });
  });

  it('Accept without Repost on a DL upgrade keeps Look', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f-share',
          status: 'allowed',
          packAskPending: true,
          accessKind: 'look',
          followerCompanyId: 'trader',
          followedCompanyId: 'mill',
        }),
        update,
        delete: vi.fn(),
      },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.decide('mill', 'trader', 'look')).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f-share' },
      data: { packAskPending: false },
    });
  });

  it('Reject on a DL Repost upgrade keeps Look and clears pack ask', async () => {
    const update = vi.fn(async () => ({}));
    const create = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: async () => ({
          id: 'f-share',
          status: 'allowed',
          packAskPending: true,
          accessKind: 'look',
          followerCompanyId: 'trader',
          followedCompanyId: 'mill',
        }),
        update,
        delete: vi.fn(),
      },
      message: { create },
    } as unknown as PrismaService;
    const threads = { findExactPairDirectThreadId: vi.fn(async () => 'thread-1') };
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
      threads as unknown as ThreadService,
    );
    await expect(service.decide('mill', 'trader', 'deny')).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f-share' },
      data: {
        status: 'allowed',
        accessKind: 'look',
        packAskPending: false,
      },
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe('FollowService.listFollowers', () => {
  it('includes stopped shops on They see mine', async () => {
    const findMany = vi.fn(async () => [
      {
        accessKind: null,
        status: 'stopped',
        createdAt: new Date('2026-09-28T00:00:00.000Z'),
        follower: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', verification: 'none', logoUrl: null, sellCategories: [], buyCategories: [] },
      },
    ]);
    const toCompanyCard = vi.fn((company: { id: string }) => ({
      id: company.id,
      name: 'Jaipur Emporium',
      city: 'Jaipur',
      verification: 'none',
      logoUrl: null,
    }));
    const prisma = { follow: { findMany } } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      { toCompanyCard } as unknown as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.listFollowers('shop')).resolves.toEqual([
      {
        company: {
          id: 'c1',
          name: 'Jaipur Emporium',
          city: 'Jaipur',
          verification: 'none',
          logoUrl: null,
        },
        accessKind: 'look',
        stopped: true,
        createdAt: '2026-09-28T00:00:00.000Z',
      },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { followedCompanyId: 'shop', status: { in: ['allowed', 'stopped'] } },
      }),
    );
  });
});

describe('FollowService.requestShare', () => {
  it('sets packAskPending while Look stays', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      company: { findUnique: async () => ({ id: 'mill' }) },
      follow: {
        findUnique: async () => ({
          id: 'f-look',
          status: 'allowed',
          accessKind: 'look',
          packAskPending: false,
        }),
        update,
      },
    } as unknown as PrismaService;
    const visibility = { isBlocked: async () => false } as unknown as VisibilityService;
    const service = new FollowService(prisma, visibility, {} as DiscoverySerializer, noopThreads, noopEvents);
    await expect(service.requestShare('trader', 'mill')).resolves.toEqual({
      following: true,
      pending: false,
      packAskPending: true,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f-look' },
      data: { packAskPending: true },
    });
  });

  it('reopens Stopped as pending pack ask (not bare follow)', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      company: { findUnique: async () => ({ id: 'mill' }) },
      follow: {
        findUnique: async () => ({
          id: 'f-stopped',
          status: 'stopped',
          accessKind: null,
          packAskPending: false,
        }),
        update,
      },
    } as unknown as PrismaService;
    const visibility = { isBlocked: async () => false } as unknown as VisibilityService;
    const service = new FollowService(prisma, visibility, {} as DiscoverySerializer, noopThreads, noopEvents);
    await expect(service.requestShare('trader', 'mill')).resolves.toEqual({
      following: false,
      pending: true,
      packAskPending: true,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f-stopped' },
      data: {
        status: 'pending',
        accessKind: null,
        packAskPending: true,
      },
    });
  });
});

describe('FollowService.listAsks', () => {
  it('includes Share upgrades with kind share', async () => {
    const findMany = vi.fn(async () => [
      {
        status: 'allowed',
        packAskPending: true,
        followerCompanyId: 'c1',
        createdAt: new Date('2026-10-31T00:00:00.000Z'),
        follower: { id: 'c1', name: 'Yash', city: 'Ahmedabad', verification: 'none', logoUrl: null, sellCategories: [], buyCategories: [] },
      },
    ]);
    const toCompanyCard = vi.fn((company: { id: string }) => ({
      id: company.id,
      name: 'Yash',
      city: 'Ahmedabad',
      verification: 'none',
      logoUrl: null,
    }));
    const prisma = {
      follow: { findMany },
      companyBlock: { findMany: async () => [] },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      { toCompanyCard } as unknown as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.listAsks('mill')).resolves.toEqual([
      {
        company: {
          id: 'c1',
          name: 'Yash',
          city: 'Ahmedabad',
          verification: 'none',
          logoUrl: null,
        },
        createdAt: '2026-10-31T00:00:00.000Z',
        kind: 'share',
        blockedByMe: false,
      },
    ]);
  });

  it('marks pending pack asks as share (Stopped reopen)', async () => {
    const findMany = vi.fn(async () => [
      {
        status: 'pending',
        packAskPending: true,
        followerCompanyId: 'c2',
        createdAt: new Date('2026-11-04T00:00:00.000Z'),
        follower: {
          id: 'c2',
          name: 'Meena',
          city: 'Surat',
          verification: 'none',
          logoUrl: null,
          sellCategories: [],
          buyCategories: [],
        },
      },
    ]);
    const toCompanyCard = vi.fn((company: { id: string }) => ({
      id: company.id,
      name: 'Meena',
      city: 'Surat',
      verification: 'none',
      logoUrl: null,
    }));
    const prisma = {
      follow: { findMany },
      companyBlock: { findMany: async () => [{ blockedCompanyId: 'c2' }] },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      { toCompanyCard } as unknown as DiscoverySerializer,
    noopThreads,
      noopEvents,
    );
    await expect(service.listAsks('mill')).resolves.toEqual([
      {
        company: {
          id: 'c2',
          name: 'Meena',
          city: 'Surat',
          verification: 'none',
          logoUrl: null,
        },
        createdAt: '2026-11-04T00:00:00.000Z',
        kind: 'share',
        blockedByMe: true,
      },
    ]);
  });
});

describe('FollowService.setAccess', () => {
  const follower = {
    id: 'trader',
    name: 'Trader 1',
    city: 'Surat',
    verification: 'none',
    logoUrl: null,
    sellCategories: [],
    buyCategories: [],
  };

  it('posts Repost-off on Pack→Look with named metadata in exact pair Direct', async () => {
    const create = vi.fn(async () => ({}));
    const threadUpdate = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: vi.fn(async () => ({
          id: 'f1',
          followedCompanyId: 'mill',
          status: 'allowed',
          accessKind: 'pack',
          packAskPending: false,
          follower,
        })),
        update: vi.fn(async () => ({
          accessKind: 'look',
          status: 'allowed',
          createdAt: new Date('2026-11-17T00:00:00.000Z'),
          follower,
        })),
      },
      company: {
        findMany: vi.fn(async () => [
          { id: 'mill', name: 'Supplier 1' },
          { id: 'trader', name: 'Trader 1' },
        ]),
      },
      message: { create },
      thread: { update: threadUpdate },
    } as unknown as PrismaService;
    const threads = {
      findExactPairDirectThreadId: vi.fn(async () => 'thread-mt'),
    };
    const toCompanyCard = vi.fn(() => ({
      id: 'trader',
      name: 'Trader 1',
      city: 'Surat',
      verification: 'none',
      logoUrl: null,
    }));
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      { toCompanyCard } as unknown as DiscoverySerializer,
      threads as unknown as ThreadService,
    );
    await service.setAccess('mill', 'trader', 'look');
    expect(threads.findExactPairDirectThreadId).toHaveBeenCalledWith('mill', 'trader');
    expect(create).toHaveBeenCalledWith({
      data: {
        threadId: 'thread-mt',
        senderCompanyId: 'mill',
        type: 'system',
        body: 'You turned off Repost for Trader 1',
        metadata: {
          kind: 'share_revoked',
          millCompanyId: 'mill',
          traderCompanyId: 'trader',
          millName: 'Supplier 1',
          traderName: 'Trader 1',
        },
      },
    });
    expect(threadUpdate).toHaveBeenCalled();
  });

  it('skips Repost-off when no exact pair Direct exists', async () => {
    const create = vi.fn(async () => ({}));
    const prisma = {
      follow: {
        findUnique: vi.fn(async () => ({
          id: 'f1',
          followedCompanyId: 'mill',
          status: 'allowed',
          accessKind: 'pack',
          packAskPending: false,
          follower,
        })),
        update: vi.fn(async () => ({
          accessKind: 'look',
          status: 'allowed',
          createdAt: new Date('2026-11-17T00:00:00.000Z'),
          follower,
        })),
      },
      company: { findMany: vi.fn() },
      message: { create },
      thread: { update: vi.fn() },
    } as unknown as PrismaService;
    const threads = {
      findExactPairDirectThreadId: vi.fn(async () => null),
    };
    const toCompanyCard = vi.fn(() => ({
      id: 'trader',
      name: 'Trader 1',
      city: 'Surat',
      verification: 'none',
      logoUrl: null,
    }));
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      { toCompanyCard } as unknown as DiscoverySerializer,
      threads as unknown as ThreadService,
    );
    await service.setAccess('mill', 'trader', 'look');
    expect(create).not.toHaveBeenCalled();
    expect(prisma.company.findMany).not.toHaveBeenCalled();
  });
});
