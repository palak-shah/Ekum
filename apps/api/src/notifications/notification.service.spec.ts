import { describe, expect, it, vi } from 'vitest';
import { NotificationType } from '@ekum/domain-types';
import { NotificationService, pushDeepLink } from './notification.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { WebPushService } from './web-push.service';

function makeService(overrides: Partial<PrismaService> = {}) {
  const capturedPushUserIds: string[] = [];
  const sendMany = vi.fn(async () => undefined);
  const prisma = {
    notification: {
      create: vi.fn(async () => ({ id: 'n1' })),
      deleteMany: vi.fn(async () => ({ count: 0 })),
      count: vi.fn(async () => 0),
      ...overrides.notification,
    },
    companyMembership: {
      findMany: async () => [{ userId: 'u1' }, { userId: 'u2' }],
    },
    notificationPreference: {
      findMany: async () => [
        { userId: 'u1', pushEnabled: false, mutedTypes: [] },
        { userId: 'u2', pushEnabled: true, mutedTypes: [NotificationType.Order] },
      ],
    },
    pushSubscription: {
      findMany: async ({ where }: { where: { userId: { in: string[] } } }) => {
        capturedPushUserIds.push(...where.userId.in);
        return where.userId.in.map((userId) => ({ userId, endpoint: `e/${userId}`, p256dh: 'k', auth: 'a' }));
      },
    },
    ...overrides,
  } as unknown as PrismaService;
  const webPush = { sendMany } as unknown as WebPushService;
  return { service: new NotificationService(prisma, webPush), sendMany, capturedPushUserIds, prisma };
}

describe('NotificationService.create push fan-out', () => {
  it('skips push entirely when no user is eligible (off or muted)', async () => {
    const { service, sendMany } = makeService();
    // u1 has push off; u2 has muted the 'order' type — nobody is eligible.
    await service.create({
      recipientCompanyId: 'co',
      type: NotificationType.Order,
      title: 'New order',
    });
    expect(sendMany).not.toHaveBeenCalled();
  });

  it('pushes only to eligible users for an unmuted type', async () => {
    const { service, sendMany, capturedPushUserIds } = makeService();
    // For 'message': u1 still off, u2 eligible (order mute does not apply).
    await service.create({
      recipientCompanyId: 'co',
      type: NotificationType.Message,
      title: 'New message',
      refType: 'thread',
      refId: 'th-1',
    });
    expect(capturedPushUserIds).toEqual(['u2']);
    expect(sendMany).toHaveBeenCalledOnce();
    expect(sendMany.mock.calls[0]![1]).toMatchObject({ url: '/chats/th-1' });
  });
});

describe('NotificationService.unreadCount scope', () => {
  it('scopes unread count to company + viewer (null or self user rows)', async () => {
    const count = vi.fn(async () => 2);
    const { service } = makeService({
      notification: { count },
    } as Partial<PrismaService>);
    const result = await service.unreadCount('co-a', 'user-me');
    expect(count).toHaveBeenCalledWith({
      where: {
        recipientCompanyId: 'co-a',
        readAt: null,
        OR: [{ recipientUserId: null }, { recipientUserId: 'user-me' }],
      },
    });
    expect(result.count).toBe(2);
  });
});

describe('NotificationService.delete', () => {
  it('deleteOne scopes to recipient company', async () => {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const { service } = makeService({
      notification: { deleteMany },
    } as Partial<PrismaService>);
    await service.deleteOne('co-a', 'n-1');
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: 'n-1', recipientCompanyId: 'co-a' },
    });
  });

  it('deleteRead removes only read rows', async () => {
    const deleteMany = vi.fn(async () => ({ count: 3 }));
    const { service } = makeService({
      notification: { deleteMany },
    } as Partial<PrismaService>);
    const result = await service.deleteRead('co-a');
    expect(deleteMany).toHaveBeenCalledWith({
      where: { recipientCompanyId: 'co-a', readAt: { not: null } },
    });
    expect(result.deleted).toBe(3);
  });

  it('deleteAll removes every row for the company', async () => {
    const deleteMany = vi.fn(async () => ({ count: 5 }));
    const { service } = makeService({
      notification: { deleteMany },
    } as Partial<PrismaService>);
    const result = await service.deleteAll('co-a');
    expect(deleteMany).toHaveBeenCalledWith({
      where: { recipientCompanyId: 'co-a' },
    });
    expect(result.deleted).toBe(5);
  });
});

describe('pushDeepLink', () => {
  it('maps ref types to app paths', () => {
    expect(pushDeepLink('order', 'o1')).toBe('/orders/o1');
    expect(pushDeepLink('thread', 't1')).toBe('/chats/t1');
    expect(pushDeepLink('collection', 'c1')).toBe('/collections/c1');
    expect(pushDeepLink('product', 'p1')).toBe('/explore/products/p1');
    expect(pushDeepLink('broadcast', 'b1')).toBe('/broadcast');
    expect(pushDeepLink('company', 'co1')).toBe('/company/co1');
    expect(pushDeepLink(null, null)).toBe('/notifications');
  });
});
