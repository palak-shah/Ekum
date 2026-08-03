import { describe, expect, it, vi } from 'vitest';
import { FollowService } from './follow.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { DiscoverySerializer } from './discovery.serializer';

function setup(options: { target: { id: string } | null; blocked: boolean }) {
  const upsert = vi.fn(async () => ({}));
  const prisma = {
    company: { findUnique: async () => options.target },
    follow: { upsert },
  } as unknown as PrismaService;
  const visibility = { isBlocked: async () => options.blocked } as unknown as VisibilityService;
  const serializer = {} as unknown as DiscoverySerializer;
  return { service: new FollowService(prisma, visibility, serializer), upsert };
}

describe('FollowService.follow', () => {
  it('rejects following your own business', async () => {
    const { service, upsert } = setup({ target: { id: 'me' }, blocked: false });
    await expect(service.follow('me', 'me')).rejects.toThrow();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('hides a business that has blocked the follower', async () => {
    const { service, upsert } = setup({ target: { id: 'target' }, blocked: true });
    await expect(service.follow('me', 'target')).rejects.toThrow();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('follows permissionlessly otherwise', async () => {
    const { service, upsert } = setup({ target: { id: 'target' }, blocked: false });
    await expect(service.follow('me', 'target')).resolves.toEqual({ following: true });
    expect(upsert).toHaveBeenCalled();
  });
});
