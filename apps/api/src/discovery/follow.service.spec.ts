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

  it('denies by deleting the row', async () => {
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
});
