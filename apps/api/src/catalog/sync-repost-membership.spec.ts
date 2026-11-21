import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus, MembershipOrigin } from '@ekum/domain-types';
import { CollectionService } from './collection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';
import type { JobQueue } from '../jobs/job-queue.service';
import type { MasterDataService } from './master-data/master-data.service';

describe('syncRepostMembershipFromSource concurrency', () => {
  it('locks the collection row then preserves exclusions from the locked read', async () => {
    const queryRawUnsafe = vi.fn(async () => [{ id: 'pack-1' }]);
    const findManyMembership = vi.fn(async () => [
      {
        productId: 'd1',
        membershipOrigin: MembershipOrigin.Synced,
        excluded: true,
        explicitlyAddedAt: null,
      },
    ]);
    const deleteMany = vi.fn(async () => ({ count: 0 }));
    const createMany = vi.fn(async () => ({ count: 0 }));
    const update = vi.fn(async () => ({}));
    const productFindMany = vi.fn(async () => [
      {
        id: 'd2',
        companyId: 't1',
        audience: 'followers',
        audienceCompanyIds: [],
        allowForward: true,
        status: 'published',
        postedToMarketAt: new Date(),
      },
    ]);

    const tx = {
      $queryRawUnsafe: queryRawUnsafe,
      collectionProduct: {
        findMany: findManyMembership,
        deleteMany,
        createMany,
      },
      product: { findMany: productFindMany },
      collection: { update },
    };

    const prisma = {
      collection: {
        findFirst: vi.fn(async () => ({
          id: 'pack-1',
          companyId: 't1',
          status: CollectionStatus.Published,
          kind: 'regular',
          repostSourceCollectionId: 'src-1',
          repostSourceProductId: null,
        })),
        findUnique: vi.fn(async () => ({ audience: 'followers' })),
      },
      connection: { findMany: vi.fn(async () => []) },
      follow: { findMany: vi.fn(async () => []) },
      companyBlock: { findMany: vi.fn(async () => []) },
      productRelistGrant: { findMany: vi.fn(async () => []) },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      {} as CatalogSerializer,
      { enqueue: vi.fn() } as unknown as JobQueue,
      {} as MasterDataService,
    );

    const result = await service.syncRepostMembershipFromSource('t1', 'u1', 'pack-1', {
      sourceProductIds: ['d1', 'd2'],
      previouslySyncedProductIds: ['d1'],
    });

    expect(queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      'pack-1',
    );
    expect(result.membershipChanged).toBe(true);
    expect(result.activeProductIds).toEqual(['d2']);
    expect(result.addedProductIds).toEqual(['d2']);
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ productId: 'd1', excluded: true }),
          expect.objectContaining({ productId: 'd2', excluded: false }),
        ]),
      }),
    );
  });
});
