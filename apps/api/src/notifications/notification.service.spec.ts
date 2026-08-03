import { describe, expect, it, vi } from 'vitest';
import { NotificationType } from '@ekum/domain-types';
import { NotificationService } from './notification.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { WebPushService } from './web-push.service';

function makeService() {
  const capturedPushUserIds: string[] = [];
  const sendMany = vi.fn(async () => undefined);
  const prisma = {
    notification: { create: vi.fn(async () => ({ id: 'n1' })) },
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
  } as unknown as PrismaService;
  const webPush = { sendMany } as unknown as WebPushService;
  return { service: new NotificationService(prisma, webPush), sendMany, capturedPushUserIds };
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
    });
    expect(capturedPushUserIds).toEqual(['u2']);
    expect(sendMany).toHaveBeenCalledOnce();
  });
});
