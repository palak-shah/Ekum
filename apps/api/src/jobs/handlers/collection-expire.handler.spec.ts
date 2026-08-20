import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus } from '@ekum/domain-types';
import { CollectionExpireHandler } from './collection-expire.handler';
import type { PrismaService } from '../../core/prisma/prisma.service';

describe('CollectionExpireHandler', () => {
  it('hides a published collection past endsAt', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      collection: {
        findUnique: async () => ({
          id: 'col-1',
          status: CollectionStatus.Published,
          endsAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
        update,
      },
    } as unknown as PrismaService;
    const handler = new CollectionExpireHandler(prisma);
    await handler.run({ collectionId: 'col-1' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'col-1' },
      data: { status: CollectionStatus.Draft, exploreActivityAt: null },
    });
  });

  it('no-ops when still inside the window', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      collection: {
        findUnique: async () => ({
          id: 'col-1',
          status: CollectionStatus.Published,
          endsAt: new Date('2099-01-01T00:00:00.000Z'),
        }),
        update,
      },
    } as unknown as PrismaService;
    const handler = new CollectionExpireHandler(prisma);
    await handler.run({ collectionId: 'col-1' });
    expect(update).not.toHaveBeenCalled();
  });
});
