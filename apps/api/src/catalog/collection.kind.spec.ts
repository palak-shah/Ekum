import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  CatalogOrderMode,
  CollectionKind,
  CollectionStatus,
  ProductStatus,
} from '@ekum/domain-types';
import { CollectionService } from './collection.service';
import { qualifyingCollectionWhere } from './general-collection';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';
import type { JobQueue } from '../jobs/job-queue.service';

const jobs = { enqueue: vi.fn(async () => 'job-1') } as unknown as JobQueue;

describe('CollectionService general + catalog', () => {
  it('rejects setProducts on General Collection', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'gc-1',
          companyId: 'company-1',
          kind: CollectionKind.General,
          status: CollectionStatus.Published,
        }),
      },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.setProducts('company-1', 'u1', 'gc-1', ['p1'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects adding an own design that already sits in another pack to a catalog', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'cat-1',
          companyId: 'company-1',
          kind: CollectionKind.Catalog,
          status: CollectionStatus.Draft,
          rate: 91,
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Published,
            postedToMarketAt: null,
            catalogCollectionId: null,
          },
        ],
      },
      collectionProduct: {
        findMany: vi.fn(async (args: { where?: { collectionId?: unknown } }) =>
          typeof args?.where?.collectionId === 'string' ? [] : [{ productId: 'p1' }],
        ),
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.setProducts('company-1', 'u1', 'cat-1', ['p1'])).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lists General Collection leftover designs instead of empty join rows', async () => {
    const leftover = {
      id: 'p-left',
      createdAt: new Date('2026-10-24T00:00:00.000Z'),
      name: 'Saree',
      company: { id: 'company-1', name: 'Ravi' },
    };
    const gc = {
      id: 'gc-1',
      kind: CollectionKind.General,
      products: [],
      _count: { products: 0 },
    };
    const pack = {
      id: 'col-1',
      kind: CollectionKind.Regular,
      products: [{ productId: 'p-in' }],
      _count: { products: 1 },
    };
    const toCollectionView = vi.fn((row: { id: string }, count?: number) => ({
      id: row.id,
      productCount: count,
    }));
    const prisma = {
      collection: {
        findFirst: async () => gc,
        findMany: async () => [pack, gc],
      },
      product: {
        findMany: async () => [leftover],
      },
    } as unknown as PrismaService;
    const service = new CollectionService(
      prisma,
      { toCollectionView } as unknown as CatalogSerializer,
      jobs,
    );
    const rows = await service.list('company-1');
    expect(rows.map((row) => row.id)).toEqual(['gc-1', 'col-1']);
    expect(toCollectionView).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'gc-1',
        products: [expect.objectContaining({ productId: 'p-left', product: leftover })],
        _count: { products: 1 },
      }),
      1,
    );
  });

  it('clears catalog exclusive stamp when an own design leaves the catalog', async () => {
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const tx = {
      $executeRawUnsafe: vi.fn(async () => undefined),
      product: { updateMany: productUpdateMany },
      collectionProduct: {
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      collection: { update: vi.fn(async () => ({})) },
    };
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'cat-1',
          companyId: 'company-1',
          kind: CollectionKind.Catalog,
          status: CollectionStatus.Published,
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'keep',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Published,
            postedToMarketAt: null,
            catalogCollectionId: 'cat-1',
          },
        ],
        count: async () => 0,
      },
      collectionProduct: {
        findMany: vi.fn(async (args: { where?: { collectionId?: unknown } }) =>
          args?.where?.collectionId === 'cat-1'
            ? [{ productId: 'keep' }, { productId: 'gone' }]
            : [],
        ),
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: async (fn: (client: typeof tx) => Promise<void>) => fn(tx),
    } as unknown as PrismaService;
    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'cat-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'cat-1' } as never);
    await service.setProducts('company-1', 'u1', 'cat-1', ['keep']);
    expect(productUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          catalogCollectionId: 'cat-1',
          id: { notIn: ['keep'] },
        }),
        data: { catalogCollectionId: null },
      }),
    );
  });

  it('stamps catalog rate onto own members on add', async () => {
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const tx = {
      $executeRawUnsafe: vi.fn(async () => undefined),
      product: { updateMany: productUpdateMany },
      collectionProduct: {
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
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
          unit: 'set',
          dispatchUnit: 'set',
          catalogRateUnit: 'pc',
          piecesPerPack: 12,
        }),
        update: vi.fn(async () => ({})),
      },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
            catalogCollectionId: null,
          },
        ],
        count: async () => 0,
      },
      collectionProduct: { findMany: async () => [] },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: async (fn: (client: typeof tx) => Promise<void>) => fn(tx),
    } as unknown as PrismaService;
    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'cat-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'cat-1' } as never);
    await expect(service.setProducts('company-1', 'u1', 'cat-1', ['p1'])).resolves.toEqual({
      id: 'cat-1',
    });
    expect(productUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rate: 91 }),
      }),
    );
  });

  it('rejects deleted designs on setProducts', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          kind: CollectionKind.Regular,
          status: CollectionStatus.Draft,
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Archived,
            postedToMarketAt: null,
            catalogCollectionId: null,
          },
        ],
      },
      collectionProduct: { findMany: async () => [] },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.setProducts('company-1', 'u1', 'col-1', ['p1'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects adding an exclusive catalog design without relocateExclusive', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          kind: CollectionKind.Regular,
          status: CollectionStatus.Draft,
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Published,
            postedToMarketAt: null,
            catalogCollectionId: 'cat-old',
          },
        ],
      },
      collectionProduct: { findMany: async () => [] },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.setProducts('company-1', 'u1', 'col-1', ['p1'])).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('relocates an exclusive design into another catalog', async () => {
    const productUpdateMany = vi.fn(async (args: { data?: { catalogCollectionId?: null } }) => {
      if (args.data && 'catalogCollectionId' in args.data && args.data.catalogCollectionId === null) {
        return { count: 1 };
      }
      return { count: 1 };
    });
    const collectionProductDeleteMany = vi.fn(async () => ({}));
    const tx = {
      $executeRawUnsafe: vi.fn(async () => undefined),
      product: { updateMany: productUpdateMany },
      collectionProduct: {
        deleteMany: collectionProductDeleteMany,
        createMany: vi.fn(async () => ({})),
      },
      collection: { update: vi.fn(async () => ({})) },
    };
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'cat-new',
          companyId: 'company-1',
          kind: CollectionKind.Catalog,
          status: CollectionStatus.Draft,
          rate: 91,
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
            catalogCollectionId: 'cat-old',
          },
        ],
        count: async () => 0,
      },
      collectionProduct: {
        findMany: async (args: { where?: { productId?: { in: string[] } } }) =>
          args.where?.productId ? [{ productId: 'p1' }] : [],
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: async (fn: (client: typeof tx) => Promise<void>) => fn(tx),
    } as unknown as PrismaService;
    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'cat-new' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'cat-new' } as never);
    await expect(
      service.setProducts('company-1', 'u1', 'cat-new', ['p1'], { relocateExclusive: true }),
    ).resolves.toEqual({ id: 'cat-new' });
    expect(collectionProductDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId: { in: ['p1'] },
          collectionId: { not: 'cat-new' },
          collection: qualifyingCollectionWhere('company-1'),
        }),
      }),
    );
  });

  it('rejects adding an exclusive design to another catalog without relocate', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'cat-new',
          companyId: 'company-1',
          kind: CollectionKind.Catalog,
          status: CollectionStatus.Draft,
          rate: 91,
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
            catalogCollectionId: 'cat-old',
          },
        ],
        count: async () => 0,
      },
      collectionProduct: {
        findMany: async (args: { where?: { productId?: { in: string[] } } }) =>
          args.where?.productId ? [{ productId: 'p1' }] : [],
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.setProducts('company-1', 'u1', 'cat-new', ['p1'])).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('relocates an exclusive design into a regular collection', async () => {
    const collectionProductDeleteMany = vi.fn(async () => ({}));
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const tx = {
      product: { updateMany: productUpdateMany },
      collectionProduct: {
        deleteMany: collectionProductDeleteMany,
        createMany: vi.fn(async () => ({})),
      },
      collection: { update: vi.fn(async () => ({})) },
    };
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          kind: CollectionKind.Regular,
          status: CollectionStatus.Draft,
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Published,
            postedToMarketAt: null,
            catalogCollectionId: 'cat-old',
          },
        ],
        count: async () => 0,
      },
      collectionProduct: { findMany: async () => [] },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: async (fn: (client: typeof tx) => Promise<void>) => fn(tx),
    } as unknown as PrismaService;
    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'col-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);
    await expect(
      service.setProducts('company-1', 'u1', 'col-1', ['p1'], { relocateExclusive: true }),
    ).resolves.toEqual({ id: 'col-1' });
    expect(productUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { catalogCollectionId: null },
      }),
    );
  });

  it('rejects catalog claim when another catalog already took the design', async () => {
    const tx = {
      $executeRawUnsafe: vi.fn(async () => undefined),
      product: { updateMany: vi.fn(async () => ({ count: 0 })) },
      collectionProduct: {
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
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
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'followers',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
            catalogCollectionId: null,
          },
        ],
        count: async () => 0,
      },
      collectionProduct: { findMany: async () => [] },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: async (fn: (client: typeof tx) => Promise<void>) => fn(tx),
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.setProducts('company-1', 'u1', 'cat-1', ['p1'])).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('delete with alsoArchiveDesigns archives unshared own members', async () => {
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          kind: CollectionKind.Regular,
          status: CollectionStatus.Published,
        }),
        update: async () => ({
          id: 'col-1',
          status: CollectionStatus.Archived,
          _count: { products: 1 },
        }),
      },
      collectionProduct: {
        findMany: async () => [{ productId: 'p1' }],
        count: async () => 0,
      },
      product: { updateMany: productUpdateMany },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: () => ({ id: 'col-1', status: CollectionStatus.Archived }),
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);
    await service.setStatus('company-1', 'u1', 'col-1', CollectionStatus.Archived, {
      alsoArchiveDesigns: true,
    });
    expect(productUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ProductStatus.Archived }),
      }),
    );
  });

  it('persists orderMode on catalog PATCH and freezes kind', async () => {
    const update = vi.fn(async () => ({
      id: 'cat-1',
      kind: CollectionKind.Catalog,
      orderMode: CatalogOrderMode.Pick,
      products: [],
      _count: { products: 0 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'cat-1',
          companyId: 'company-1',
          name: 'Season',
          kind: CollectionKind.Catalog,
          status: CollectionStatus.Draft,
          startsAt: null,
          endsAt: null,
        }),
        update,
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);
    await service.update('company-1', 'u1', 'cat-1', {
      orderMode: CatalogOrderMode.Pick,
      kind: CollectionKind.Regular,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ orderMode: CatalogOrderMode.Pick }),
      }),
    );
    expect(update.mock.calls[0]?.[0]?.data?.kind).toBeUndefined();
  });

  it('ignores orderMode on a regular collection PATCH', async () => {
    const update = vi.fn(async () => ({
      id: 'col-1',
      kind: CollectionKind.Regular,
      products: [],
      _count: { products: 0 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          name: 'Wedding',
          kind: CollectionKind.Regular,
          status: CollectionStatus.Draft,
          startsAt: null,
          endsAt: null,
        }),
        update,
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);
    await service.update('company-1', 'u1', 'col-1', {
      orderMode: CatalogOrderMode.Whole,
    });
    expect(update.mock.calls[0]?.[0]?.data?.orderMode).toBeUndefined();
  });
});
