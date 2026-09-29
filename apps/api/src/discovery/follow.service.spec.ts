import { describe, expect, it, vi } from 'vitest';
import { FollowService } from './follow.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { DiscoverySerializer } from './discovery.serializer';

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
  return { service: new FollowService(prisma, visibility, serializer), create };
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
      existing: { status: 'allowed' },
    });
    await expect(service.follow('me', 'target')).resolves.toEqual({
      following: true,
      pending: false,
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
    const service = new FollowService(prisma, visibility, {} as DiscoverySerializer);
    await expect(service.follow('me', 'target')).resolves.toEqual({
      following: false,
      pending: true,
    });
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f-stop' },
      data: { status: 'pending', accessKind: null },
    });
  });
});

describe('FollowService.unfollow', () => {
  it('deletes the follow row', async () => {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      follow: { deleteMany },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    );
    await expect(service.unfollow('me', 'shop')).resolves.toEqual({
      following: false,
      pending: false,
    });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { followerCompanyId: 'me', followedCompanyId: 'shop' },
    });
  });
});

describe('FollowService.decide', () => {
  it('allows look on a pending ask', async () => {
    const update = vi.fn(async () => ({}));
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
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    );
    await expect(service.decide('shop', 'me', 'look')).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalled();
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
    );
    await expect(service.decide('shop', 'me', 'deny')).resolves.toEqual({ ok: true });
    expect(del).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f2' },
      data: { status: 'stopped', accessKind: null },
    });
  });

  it('allows look again from stopped', async () => {
    const update = vi.fn(async () => ({}));
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
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as VisibilityService,
      {} as DiscoverySerializer,
    );
    await expect(service.decide('shop', 'me', 'look')).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f3' },
      data: { status: 'allowed', accessKind: 'look' },
    });
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
