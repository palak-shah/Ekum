import { describe, expect, it, vi } from 'vitest';
import { NotificationType } from '@ekum/domain-types';
import { DomainEventName } from '../events/domain-events';
import { NotificationListeners } from './notification.listeners';
import type { NotificationService } from './notification.service';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('RepostSyncDesignsAdded notify (F-06)', () => {
  it('creates one Collection notification for added designs', async () => {
    const create = vi.fn(async () => undefined);
    const listeners = new NotificationListeners(
      { create } as unknown as NotificationService,
      {} as PrismaService,
    );
    await listeners.onRepostSyncDesignsAdded({
      collectionId: 'pack-1',
      collectionName: 'Festive',
      ownerCompanyId: 'trader',
      addedCount: 3,
    });
    expect(create).toHaveBeenCalledWith({
      recipientCompanyId: 'trader',
      type: NotificationType.Collection,
      title: 'Designs added to your collection',
      body: '3 new designs in Festive',
      refType: 'collection',
      refId: 'pack-1',
    });
  });

  it('skips zero adds (no duplicate noise)', async () => {
    const create = vi.fn(async () => undefined);
    const listeners = new NotificationListeners(
      { create } as unknown as NotificationService,
      {} as PrismaService,
    );
    await listeners.onRepostSyncDesignsAdded({
      collectionId: 'pack-1',
      collectionName: 'Festive',
      ownerCompanyId: 'trader',
      addedCount: 0,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('event name is registered once', () => {
    expect(DomainEventName.RepostSyncDesignsAdded).toBe('repost.sync_designs_added');
  });
});
