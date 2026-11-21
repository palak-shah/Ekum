import { CollectionKind, CollectionStatus, ProductStatus } from '@ekum/domain-types';
import { describe, expect, it, vi } from 'vitest';
import { CollectionService } from './collection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';
import type { JobQueue } from '../jobs/job-queue.service';
import type { MasterDataService } from './master-data/master-data.service';

const jobs = { enqueue: vi.fn(async () => 'job-1') } as unknown as JobQueue;
const masterData = {} as MasterDataService;

function ownProduct(over: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    companyId: 'company-1',
    audience: 'followers',
    audienceCompanyIds: [],
    allowForward: true,
    status: ProductStatus.Published,
    postedToMarketAt: null,
    catalogCollectionId: 'cat-old',
    masterCategoryId: null,
    categories: [],
    ...over,
  };
}

describe('setProducts Collection FOR UPDATE on repost catalog/relocate', () => {
  it('locks the Collection row before catalog membership writes when isRepost', async () => {
    const callOrder: string[] = [];
    const queryRawUnsafe = vi.fn(async () => {
      callOrder.push('collection-lock');
      return [{ id: 'cat-repost' }];
    });
    const executeRawUnsafe = vi.fn(async () => {
      callOrder.push('product-lock');
    });
    const deleteMany = vi.fn(async () => {
      callOrder.push('delete-membership');
      return { count: 0 };
    });
    const createMany = vi.fn(async () => {
      callOrder.push('create-membership');
      return { count: 1 };
    });
    const tx = {
      $queryRawUnsafe: queryRawUnsafe,
      $executeRawUnsafe: executeRawUnsafe,
      product: {
        updateMany: vi.fn(async () => {
          callOrder.push('product-update');
          return { count: 1 };
        }),
      },
      collectionProduct: { deleteMany, createMany },
      collection: {
        update: vi.fn(async () => {
          callOrder.push('collection-update');
          return {};
        }),
      },
    };
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'cat-repost',
          companyId: 'company-1',
          kind: CollectionKind.Catalog,
          status: CollectionStatus.Draft,
          rate: 91,
          rateMax: null,
          unit: null,
          dispatchUnit: null,
          catalogRateUnit: null,
          piecesPerPack: null,
          repostSourceCollectionId: 'src-1',
        }),
        findUnique: async () => ({ audience: 'followers' }),
        update: vi.fn(async () => ({})),
      },
      product: {
        findMany: async () => [ownProduct({ catalogCollectionId: null, id: 'p1' })],
        count: async () => 0,
      },
      collectionProduct: {
        findMany: vi.fn(async (args: { where?: { collectionId?: string } }) => {
          // previous membership + source active members + otherQualifying
          if (args.where?.collectionId === 'src-1') {
            return [{ productId: 'p1' }];
          }
          return [];
        }),
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) => fn(tx)),
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'cat-repost' }) } as unknown as CatalogSerializer,
      jobs,
      masterData,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'cat-repost' } as never);

    await service.setProducts('company-1', 'u1', 'cat-repost', ['p1']);

    expect(queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      'cat-repost',
    );
    expect(callOrder[0]).toBe('collection-lock');
    expect(callOrder.indexOf('collection-lock')).toBeLessThan(
      callOrder.indexOf('delete-membership'),
    );
  });

  it('locks the Collection row before relocate into a repost regular pack', async () => {
    const callOrder: string[] = [];
    const queryRawUnsafe = vi.fn(async () => {
      callOrder.push('collection-lock');
      return [{ id: 'col-repost' }];
    });
    const deleteMany = vi.fn(async () => {
      callOrder.push('delete');
      return { count: 0 };
    });
    const createMany = vi.fn(async () => {
      callOrder.push('create');
      return { count: 1 };
    });
    const tx = {
      $queryRawUnsafe: queryRawUnsafe,
      product: {
        updateMany: vi.fn(async () => {
          callOrder.push('clear-catalog-stamp');
          return { count: 1 };
        }),
      },
      collectionProduct: { deleteMany, createMany },
      collection: {
        update: vi.fn(async () => {
          callOrder.push('collection-update');
          return {};
        }),
      },
    };
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-repost',
          companyId: 'company-1',
          kind: CollectionKind.Regular,
          status: CollectionStatus.Draft,
          repostSourceCollectionId: 'src-1',
        }),
        findUnique: async () => ({ audience: 'followers' }),
        update: vi.fn(async () => ({})),
      },
      product: {
        findMany: async () => [ownProduct()],
        count: async () => 0,
      },
      collectionProduct: {
        findMany: vi.fn(async (args: { where?: { collectionId?: string } }) => {
          if (args.where?.collectionId === 'src-1') return [{ productId: 'p1' }];
          return [];
        }),
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) => fn(tx)),
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'col-repost' }) } as unknown as CatalogSerializer,
      jobs,
      masterData,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-repost' } as never);

    await service.setProducts('company-1', 'u1', 'col-repost', ['p1'], {
      relocateExclusive: true,
    });

    expect(queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      'col-repost',
    );
    expect(callOrder[0]).toBe('collection-lock');
    expect(callOrder.indexOf('collection-lock')).toBeLessThan(callOrder.indexOf('delete'));
  });

  it('does not Collection-lock catalog writes when the pack is not a repost', async () => {
    const queryRawUnsafe = vi.fn(async () => []);
    const tx = {
      $queryRawUnsafe: queryRawUnsafe,
      $executeRawUnsafe: vi.fn(async () => undefined),
      product: { updateMany: vi.fn(async () => ({ count: 1 })) },
      collectionProduct: {
        deleteMany: vi.fn(async () => ({ count: 0 })),
        createMany: vi.fn(async () => ({ count: 1 })),
      },
      collection: { update: vi.fn(async () => ({})) },
    };
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'cat-1',
          companyId: 'company-1',
          kind: CollectionKind.Catalog,
          status: CollectionStatus.Draft,
          rate: 91,
          rateMax: null,
          unit: null,
          dispatchUnit: null,
          catalogRateUnit: null,
          piecesPerPack: null,
          repostSourceCollectionId: null,
          repostSourceProductId: null,
        }),
      },
      product: {
        findMany: async () => [ownProduct({ catalogCollectionId: null })],
        count: async () => 0,
      },
      collectionProduct: { findMany: async () => [] },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) => fn(tx)),
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'cat-1' }) } as unknown as CatalogSerializer,
      jobs,
      masterData,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'cat-1' } as never);

    await service.setProducts('company-1', 'u1', 'cat-1', ['p1']);
    expect(queryRawUnsafe).not.toHaveBeenCalled();
  });
});
