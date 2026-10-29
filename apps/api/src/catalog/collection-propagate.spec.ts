import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus, PublishAudience, RepostOrigin } from '@ekum/domain-types';
import { CollectionPropagateService } from './collection-propagate.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CollectionService } from './collection.service';
import type { JobQueue } from '../jobs/job-queue.service';

function millLanes(
  traders: Array<{ traderCompanyId: string }> = [{ traderCompanyId: 't3' }],
  buyers: Array<{ buyerCompanyId: string; createdAt?: Date }> = [
    { buyerCompanyId: 'b1', createdAt: new Date('2026-10-01') },
  ],
) {
  return {
    findMany: vi.fn(async (args: { where?: { traderCompanyId?: string } }) => {
      if (args?.where?.traderCompanyId) return buyers;
      return traders;
    }),
  };
}

describe('CollectionPropagateService', () => {
  it('Example A: two triggers for the same root create one pack', async () => {
    const create = vi.fn(async () => ({ id: 'POST-301' }));
    const setProducts = vi.fn(async () => ({}));
    const publish = vi.fn(async () => ({}));
    const collections = { create, setProducts, publish } as unknown as CollectionService;
    const jobs = { enqueue: vi.fn(async () => 'job') } as unknown as JobQueue;

    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: new Date('2026-10-28'),
      updatedAt: new Date('2026-10-28'),
      repostSourceCollectionId: null,
    };

    const prisma = {
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'POST-100') return source;
          return { ...source, id: where.id, companyId: 's1', repostSourceCollectionId: null };
        }),
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
        update: vi.fn(async () => ({})),
      },
      tradeLane: millLanes(),
      follow: {
        findUnique: vi.fn(async () => ({ status: 'allowed' })),
      },
      collectionProduct: {
        findMany: vi.fn(async () => [{ productId: 'd1' }]),
      },
      companyMembership: {
        findFirst: vi.fn(async () => ({ userId: 'owner-t3' })),
      },
    } as unknown as PrismaService;

    const service = new CollectionPropagateService(prisma, collections, jobs);
    await service.propagate('POST-100');
    expect(create).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(
      't3',
      'owner-t3',
      'POST-301',
      expect.objectContaining({
        audience: PublishAudience.Selected,
        companyIds: ['b1'],
        showSourceShops: true,
      }),
    );

    prisma.collection.findMany = vi.fn(async () => [
      {
        id: 'POST-301',
        status: CollectionStatus.Published,
        createdAt: new Date('2026-10-28'),
        exploreActivityAt: new Date('2026-10-28'),
        companyId: 't3',
        repostSyncedSourceAt: new Date('2026-10-28'),
        repostSyncedProductIds: ['d1'],
      },
    ]);
    await service.propagate('POST-100');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('still hops the next trader when one pack cannot copy members', async () => {
    const create = vi.fn(async () => ({ id: 'POST-301' }));
    const setProducts = vi.fn(async (traderCompanyId: string) => {
      if (traderCompanyId === 't1') {
        const err = new Error('not visible') as Error & { getResponse: () => { code: string } };
        err.getResponse = () => ({ code: 'NOT_DISCOVERABLE' });
        throw err;
      }
      return {};
    });
    const publish = vi.fn(async () => ({}));
    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: new Date('2026-10-28'),
      updatedAt: new Date('2026-10-28'),
      repostSourceCollectionId: null,
    };
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => source),
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
        update: vi.fn(async () => ({})),
      },
      tradeLane: millLanes(
        [{ traderCompanyId: 't1' }, { traderCompanyId: 't2' }],
        [{ buyerCompanyId: 'b1' }],
      ),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      collectionProduct: { findMany: vi.fn(async () => [{ productId: 'd1' }]) },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create, setProducts, publish } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(create).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenCalledWith(
      't2',
      'owner',
      'POST-301',
      expect.objectContaining({ audience: PublishAudience.Selected }),
    );
  });

  it('skips create when Relist is off and does not delete the existing pack', async () => {
    const create = vi.fn(async () => ({ id: 'x' }));
    const collections = {
      create,
      setProducts: vi.fn(),
      publish: vi.fn(),
    } as unknown as CollectionService;
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'POST-100',
          companyId: 's1',
          name: 'Mill pack',
          coverImage: null,
          status: CollectionStatus.Published,
          audience: 'followers',
          audienceCompanyIds: [],
          allowForward: false,
          exploreActivityAt: new Date(),
          updatedAt: new Date(),
          repostSourceCollectionId: null,
        })),
      },
      tradeLane: millLanes(),
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      collections,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(create).not.toHaveBeenCalled();
  });

  it('Example C: existing manual pack gets source design adds, no second pack', async () => {
    const create = vi.fn(async () => ({ id: 'POST-302' }));
    const setProducts = vi.fn(async () => ({}));
    const collections = {
      create,
      setProducts,
      publish: vi.fn(),
    } as unknown as CollectionService;
    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: new Date('2026-10-29'),
      updatedAt: new Date('2026-10-29'),
      repostSourceCollectionId: null,
    };
    const prisma = {
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'POST-301') {
            return {
              id: 'POST-301',
              status: CollectionStatus.Published,
              repostSyncedSourceAt: new Date('2026-10-28'),
              repostSyncedProductIds: ['d1'],
              companyId: 't3',
            };
          }
          return source;
        }),
        findMany: vi.fn(async () => [
          {
            id: 'POST-301',
            status: CollectionStatus.Published,
            createdAt: new Date('2026-10-01'),
            exploreActivityAt: new Date('2026-10-01'),
          },
        ]),
        update: vi.fn(async () => ({})),
      },
      tradeLane: millLanes(),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      collectionProduct: {
        findMany: vi.fn(async ({ where }: { where: { collectionId: string } }) => {
          if (where.collectionId === 'POST-100') {
            return [{ productId: 'd1' }, { productId: 'd2' }, { productId: 'd3' }];
          }
          return [{ productId: 'd1' }, { productId: 'extra' }];
        }),
      },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;

    await new CollectionPropagateService(
      prisma,
      collections,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(create).not.toHaveBeenCalled();
    expect(setProducts).toHaveBeenCalledWith(
      't3',
      'owner',
      'POST-301',
      expect.arrayContaining(['d1', 'd2', 'd3', 'extra']),
    );
  });

  it('does not bump when the same revision arrives twice', async () => {
    const setProducts = vi.fn(async () => ({}));
    const update = vi.fn(async () => ({}));
    const token = new Date('2026-10-29');
    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: token,
      updatedAt: token,
      repostSourceCollectionId: null,
    };
    const prisma = {
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'POST-301') {
            return {
              id: 'POST-301',
              status: CollectionStatus.Published,
              repostSyncedSourceAt: token,
              repostSyncedProductIds: ['d1'],
              companyId: 't3',
            };
          }
          return source;
        }),
        findMany: vi.fn(async () => [
          {
            id: 'POST-301',
            status: CollectionStatus.Published,
            createdAt: new Date('2026-10-01'),
            exploreActivityAt: token,
          },
        ]),
        update,
      },
      tradeLane: millLanes(),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      collectionProduct: {
        findMany: vi.fn(async () => [{ productId: 'd1' }]),
      },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create: vi.fn(), setProducts, publish: vi.fn() } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(setProducts).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('skips when the recipient already appears on the source chain', async () => {
    const create = vi.fn(async () => ({ id: 'loop' }));
    const source = {
      id: 'POST-301',
      companyId: 't3',
      name: 'T3 pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: new Date('2026-10-28'),
      updatedAt: new Date('2026-10-28'),
      repostSourceCollectionId: 'POST-201',
    };
    const prisma = {
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'POST-301') return source;
          if (where.id === 'POST-201') {
            return { id: 'POST-201', companyId: 't1', repostSourceCollectionId: 'POST-100' };
          }
          return { id: 'POST-100', companyId: 's1', repostSourceCollectionId: null };
        }),
      },
      tradeLane: millLanes([{ traderCompanyId: 't1' }]),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create, setProducts: vi.fn(), publish: vi.fn() } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-301');
    expect(create).not.toHaveBeenCalled();
  });

  it('retries unique conflict by syncing the existing pack', async () => {
    const create = vi.fn(async () => {
      const err = Object.assign(new Error('unique'), { code: 'P2002' });
      throw err;
    });
    const setProducts = vi.fn(async () => ({}));
    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: new Date('2026-10-29'),
      updatedAt: new Date('2026-10-29'),
      repostSourceCollectionId: null,
    };
    let findManyCalls = 0;
    const prisma = {
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'POST-301') {
            return {
              id: 'POST-301',
              status: CollectionStatus.Published,
              repostSyncedSourceAt: new Date('2026-10-28'),
              repostSyncedProductIds: ['d1'],
              companyId: 't3',
            };
          }
          return source;
        }),
        findMany: vi.fn(async () => {
          findManyCalls += 1;
          if (findManyCalls === 1) return [];
          return [
            {
              id: 'POST-301',
              status: CollectionStatus.Published,
              createdAt: new Date('2026-10-01'),
              exploreActivityAt: new Date('2026-10-01'),
            },
          ];
        }),
        findFirst: vi.fn(async () => null),
        update: vi.fn(async () => ({})),
      },
      tradeLane: millLanes(),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      collectionProduct: {
        findMany: vi.fn(async ({ where }: { where: { collectionId: string } }) => {
          if (where.collectionId === 'POST-100') return [{ productId: 'd1' }, { productId: 'd2' }];
          return [{ productId: 'd1' }];
        }),
      },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create, setProducts, publish: vi.fn() } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(create).toHaveBeenCalledTimes(1);
    expect(setProducts).toHaveBeenCalledWith(
      't3',
      'owner',
      'POST-301',
      expect.arrayContaining(['d1', 'd2']),
    );
  });

  it('hops a supplier pack created after the Direct Link', async () => {
    const create = vi.fn(async () => ({ id: 'POST-301' }));
    const setProducts = vi.fn(async () => ({}));
    const publish = vi.fn(async () => ({}));
    const source = {
      id: 'POST-200',
      companyId: 's1',
      name: 'New mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: new Date('2026-10-28'),
      updatedAt: new Date('2026-10-28'),
      createdAt: new Date('2026-10-28'),
      repostSourceCollectionId: null,
    };
    const prisma = {
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'POST-200') return source;
          return { ...source, id: where.id, companyId: 's1', repostSourceCollectionId: null };
        }),
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
        update: vi.fn(async () => ({})),
      },
      tradeLane: millLanes(),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      collectionProduct: { findMany: vi.fn(async () => [{ productId: 'd1' }]) },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner-t3' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create, setProducts, publish } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-200');
    expect(create).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(
      't3',
      'owner-t3',
      'POST-301',
      expect.objectContaining({
        audience: PublishAudience.Selected,
        companyIds: ['b1'],
        showSourceShops: true,
      }),
    );
  });

  it('does not hop a supplier pack created before the Direct Link', async () => {
    const create = vi.fn(async () => ({ id: 'x' }));
    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: new Date('2026-09-02'),
      updatedAt: new Date('2026-09-02'),
      createdAt: new Date('2026-09-01'),
      repostSourceCollectionId: null,
    };
    const prisma = {
      collection: { findUnique: vi.fn(async () => source), findMany: vi.fn(async () => []) },
      tradeLane: millLanes([{ traderCompanyId: 't3' }], [
        { buyerCompanyId: 'b1', createdAt: new Date('2026-10-01') },
      ]),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create, setProducts: vi.fn(), publish: vi.fn() } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(create).not.toHaveBeenCalled();
  });

  it('skips create when the trader has no Direct Link buyers', async () => {
    const create = vi.fn(async () => ({ id: 'x' }));
    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: new Date(),
      updatedAt: new Date(),
      repostSourceCollectionId: null,
    };
    const prisma = {
      collection: { findUnique: vi.fn(async () => source), findMany: vi.fn(async () => []) },
      tradeLane: millLanes([{ traderCompanyId: 't3' }], []),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create, setProducts: vi.fn(), publish: vi.fn() } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(create).not.toHaveBeenCalled();
  });

  it('unions a second Direct Link buyer on an automatic Selected pack without bumping Explore', async () => {
    const create = vi.fn(async () => ({ id: 'x' }));
    const setProducts = vi.fn(async () => ({}));
    const update = vi.fn(async () => ({}));
    const token = new Date('2026-10-29');
    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: token,
      updatedAt: token,
      repostSourceCollectionId: null,
    };
    const dest = {
      id: 'POST-301',
      status: CollectionStatus.Published,
      companyId: 't3',
      audience: PublishAudience.Selected,
      audienceCompanyIds: ['b1'],
      repostOrigin: RepostOrigin.Automatic,
      repostSyncedSourceAt: token,
      repostSyncedProductIds: ['d1'],
    };
    const prisma = {
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'POST-301') return dest;
          return source;
        }),
        findMany: vi.fn(async () => [
          {
            id: 'POST-301',
            status: CollectionStatus.Published,
            createdAt: new Date('2026-10-01'),
            exploreActivityAt: token,
          },
        ]),
        update,
      },
      tradeLane: millLanes([{ traderCompanyId: 't3' }], [
        { buyerCompanyId: 'b1' },
        { buyerCompanyId: 'b2' },
      ]),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      collectionProduct: { findMany: vi.fn(async () => [{ productId: 'd1' }]) },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create, setProducts, publish: vi.fn() } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(create).not.toHaveBeenCalled();
    expect(setProducts).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'POST-301' },
        data: { audienceCompanyIds: ['b1', 'b2'] },
      }),
    );
    expect(update.mock.calls.some((call) => 'exploreActivityAt' in (call[0]?.data ?? {}))).toBe(
      false,
    );
  });

  it('does not shrink a Followers pack to Selected', async () => {
    const update = vi.fn(async () => ({}));
    const token = new Date('2026-10-29');
    const source = {
      id: 'POST-100',
      companyId: 's1',
      name: 'Mill pack',
      coverImage: null,
      status: CollectionStatus.Published,
      audience: 'followers',
      audienceCompanyIds: [],
      allowForward: true,
      exploreActivityAt: token,
      updatedAt: token,
      repostSourceCollectionId: null,
    };
    const prisma = {
      collection: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'POST-301') {
            return {
              id: 'POST-301',
              status: CollectionStatus.Published,
              companyId: 't3',
              audience: PublishAudience.Followers,
              audienceCompanyIds: [],
              repostOrigin: RepostOrigin.Manual,
              repostSyncedSourceAt: token,
              repostSyncedProductIds: ['d1'],
            };
          }
          return source;
        }),
        findMany: vi.fn(async () => [
          {
            id: 'POST-301',
            status: CollectionStatus.Published,
            createdAt: new Date('2026-10-01'),
            exploreActivityAt: token,
          },
        ]),
        update,
      },
      tradeLane: millLanes(),
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed' })) },
      collectionProduct: { findMany: vi.fn(async () => [{ productId: 'd1' }]) },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'owner' })) },
    } as unknown as PrismaService;
    await new CollectionPropagateService(
      prisma,
      { create: vi.fn(), setProducts: vi.fn(), publish: vi.fn() } as unknown as CollectionService,
      { enqueue: vi.fn() } as unknown as JobQueue,
    ).propagate('POST-100');
    expect(update).not.toHaveBeenCalled();
  });
});
