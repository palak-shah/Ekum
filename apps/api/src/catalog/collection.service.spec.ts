import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CollectionKind, CollectionStatus, ProductStatus } from '@ekum/domain-types';
import { CollectionService, peerRepostOmitsCategoryPick } from './collection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';
import type { JobQueue } from '../jobs/job-queue.service';

const jobs = { enqueue: vi.fn(async () => 'job-1') } as unknown as JobQueue;

function expectBadRequestCode(error: unknown, code: string): void {
  expect(error).toBeInstanceOf(BadRequestException);
  expect((error as BadRequestException).getResponse()).toMatchObject({ code });
}

const foreignPublishedProduct = {
  id: 'foreign-1',
  companyId: 'other-co',
  audience: 'everyone',
  audienceCompanyIds: [] as string[],
  allowForward: true,
  status: ProductStatus.Published,
  postedToMarketAt: new Date('2026-08-01'),
};

/** Legacy everyone/connections map to followers — curator must follow the source shop. */
function followSourceShop() {
  return {
    findMany: async (args?: { where?: { accessKind?: string } }) =>
      args?.where?.accessKind === 'look'
        ? []
        : [{ followedCompanyId: 'other-co', accessKind: 'pack', status: 'allowed' }],
  };
}

describe('CollectionService.setProducts', () => {
  it('rejects products that do not belong to the acting company', async () => {
    const transaction = vi.fn(async () => []);
    const prisma = {
      collection: { findFirst: async () => ({ id: 'col-1', companyId: 'company-1', status: 'draft' }) },
      product: {
        findMany: async () => [
          {
            id: 'p1',
            companyId: 'company-1',
            audience: 'connections',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
          },
        ],
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.setProducts('company-1', 'u1', 'col-1', ['p1', 'p2'])).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('hides collections owned by another company', async () => {
    const prisma = {
      collection: { findFirst: async () => null },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.setProducts('company-1', 'u1', 'col-1', ['p1'])).rejects.toThrow();
  });

  it('bumps exploreActivityAt when a published design is newly added to a live collection', async () => {
    const collectionUpdate = vi.fn(async () => ({}));
    const transaction = vi.fn(async (ops: unknown[]) => ops);
    const getSpy = vi.fn(async () => ({ id: 'col-1', products: [] }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Published,
        }),
        update: collectionUpdate,
        findUniqueOrThrow: async () => ({
          id: 'col-1',
          products: [],
        }),
      },
      product: {
        findMany: async () => [
          {
            id: 'old',
            companyId: 'company-1',
            audience: 'connections',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Published,
            postedToMarketAt: new Date(),
          },
          {
            id: 'new-published',
            companyId: 'company-1',
            audience: 'connections',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Published,
            postedToMarketAt: new Date(),
          },
        ],
        count: vi.fn().mockResolvedValue(1),
      },
      collectionProduct: {
        findMany: async () => [{ productId: 'old' }],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const serializer = {
      toCollectionDetail: () => ({ id: 'col-1' }),
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);
    vi.spyOn(service, 'get').mockImplementation(getSpy as never);

    await service.setProducts('company-1', 'u1', 'col-1', ['old', 'new-published']);

    expect(transaction).toHaveBeenCalled();
    const ops = transaction.mock.calls[0][0] as unknown[];
    expect(ops.length).toBe(3);
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'col-1' },
        data: expect.objectContaining({ exploreActivityAt: expect.any(Date) }),
      }),
    );
  });

  it('does not bump exploreActivityAt on remove-only membership changes', async () => {
    const collectionUpdate = vi.fn(async () => ({}));
    const transaction = vi.fn(async (ops: unknown[]) => ops);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Published,
        }),
        update: collectionUpdate,
      },
      product: {
        findMany: async () => [
          {
            id: 'a',
            companyId: 'company-1',
            audience: 'connections',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Published,
            postedToMarketAt: new Date(),
          },
        ],
        count: vi.fn().mockResolvedValue(0),
      },
      collectionProduct: {
        findMany: async () => [{ productId: 'a' }, { productId: 'b' }],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'col-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);

    await service.setProducts('company-1', 'u1', 'col-1', ['a']);

    const ops = transaction.mock.calls[0][0] as unknown[];
    expect(ops.length).toBe(3);
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ updatedByUserId: 'u1' }),
      }),
    );
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ exploreActivityAt: expect.any(Date) }),
      }),
    );
  });

  it('does not promote own drafts on a live pack (status stays independent)', async () => {
    const collectionUpdate = vi.fn(async () => ({}));
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const transaction = vi.fn(async (ops: unknown[]) => ops);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Published,
          audience: 'connections',
          rateVisibility: 'on_request',
          audienceCompanyIds: [],
          audienceGroupIds: [],
          allowForward: true,
          allowDownload: false,
        }),
        update: collectionUpdate,
      },
      product: {
        findMany: async () => [
          {
            id: 'draft-1',
            companyId: 'company-1',
            audience: 'connections',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
          },
        ],
        count: vi.fn().mockResolvedValue(0),
        updateMany: productUpdateMany,
      },
      collectionProduct: {
        findMany: async () => [],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'col-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);

    await service.setProducts('company-1', 'u1', 'col-1', ['draft-1']);

    const ops = transaction.mock.calls[0][0] as unknown[];
    expect(ops.length).toBe(3);
    expect(productUpdateMany).not.toHaveBeenCalled();
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          updatedByUserId: 'u1',
        }),
      }),
    );
  });

  it('does not bump exploreActivityAt when re-saving a live pack that already has own drafts', async () => {
    const collectionUpdate = vi.fn(async () => ({}));
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const transaction = vi.fn(async (ops: unknown[]) => ops);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Published,
          audience: 'connections',
          rateVisibility: 'on_request',
          audienceCompanyIds: [],
          audienceGroupIds: [],
          allowForward: true,
          allowDownload: false,
        }),
        update: collectionUpdate,
      },
      product: {
        findMany: async () => [
          {
            id: 'draft-1',
            companyId: 'company-1',
            audience: 'connections',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
          },
        ],
        count: vi.fn().mockResolvedValue(0),
        updateMany: productUpdateMany,
      },
      collectionProduct: {
        findMany: async () => [{ productId: 'draft-1' }],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'col-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);

    await service.setProducts('company-1', 'u1', 'col-1', ['draft-1']);

    expect(productUpdateMany).not.toHaveBeenCalled();
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ exploreActivityAt: expect.any(Date) }),
      }),
    );
  });

  it('does not promote own drafts on a draft pack', async () => {
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const transaction = vi.fn(async (ops: unknown[]) => ops);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
          audience: 'connections',
          rateVisibility: 'on_request',
          audienceCompanyIds: [],
          audienceGroupIds: [],
          allowForward: true,
          allowDownload: false,
        }),
        update: vi.fn(async () => ({})),
      },
      product: {
        findMany: async () => [
          {
            id: 'draft-1',
            companyId: 'company-1',
            audience: 'connections',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
          },
        ],
        count: vi.fn().mockResolvedValue(0),
        updateMany: productUpdateMany,
      },
      collectionProduct: {
        findMany: async () => [],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'col-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);

    await service.setProducts('company-1', 'u1', 'col-1', ['draft-1']);

    const ops = transaction.mock.calls[0][0] as unknown[];
    expect(ops.length).toBe(3);
    expect(productUpdateMany).not.toHaveBeenCalled();
  });

  it('does not reject a new own photo when an existing member is no longer discoverable', async () => {
    const transaction = vi.fn(async (ops: unknown[]) => ops);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Published,
          audience: 'followers',
          rateVisibility: 'on_request',
          audienceCompanyIds: [],
          audienceGroupIds: [],
          allowForward: true,
          allowDownload: false,
        }),
        update: vi.fn(async () => ({})),
      },
      product: {
        findMany: async () => [
          {
            ...foreignPublishedProduct,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
          },
          {
            id: 'new-photo',
            companyId: 'company-1',
            audience: 'connections',
            audienceCompanyIds: [],
            allowForward: true,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
          },
        ],
        count: vi.fn().mockResolvedValue(0),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      collectionProduct: {
        findMany: async () => [{ productId: 'foreign-1' }],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'col-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);

    await expect(
      service.setProducts('company-1', 'u1', 'col-1', ['foreign-1', 'new-photo']),
    ).resolves.toEqual({ id: 'col-1' });
    expect(transaction).toHaveBeenCalled();
  });

  it('allows adding another company published forwardable product', async () => {
    const transaction = vi.fn(async (ops: unknown[]) => ops);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
        }),
        update: vi.fn(async () => ({})),
      },
      product: {
        findMany: async () => [foreignPublishedProduct],
        count: async () => 0,
      },
      connection: { findMany: async () => [] },
      follow: followSourceShop(),
      collectionProduct: {
        findMany: async () => [],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      productRelistGrant: { findMany: async () => [] },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'col-1' }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);

    await expect(
      service.setProducts('company-1', 'u1', 'col-1', ['foreign-1']),
    ).resolves.toEqual({ id: 'col-1' });
    expect(transaction).toHaveBeenCalled();
  });

  it('rejects foreign product when allowForward is false', async () => {
    const transaction = vi.fn(async () => []);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
        }),
      },
      product: {
        findMany: async () => [{ ...foreignPublishedProduct, allowForward: false }],
        count: async () => 0,
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      collectionProduct: { findMany: async () => [] },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(
      service.setProducts('company-1', 'u1', 'col-1', ['foreign-1']),
    ).rejects.toSatisfy((error: unknown) => {
      expectBadRequestCode(error, 'RELIST_NOT_ALLOWED');
      return true;
    });
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe('CollectionService.checkCurateProducts', () => {
  it('blocks foreign designs the shop cannot discover', async () => {
    const prisma = {
      product: {
        findMany: async () => [
          {
            ...foreignPublishedProduct,
            status: ProductStatus.Draft,
            postedToMarketAt: null,
          },
        ],
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    const result = await service.checkCurateProducts('company-1', ['foreign-1']);
    expect(result.allowedProductIds).toEqual([]);
    expect(result.blocked).toEqual([{ productId: 'foreign-1', code: 'NOT_DISCOVERABLE' }]);
  });

  it('allows own-shop designs', async () => {
    const prisma = {
      product: {
        findMany: async () => [
          {
            ...foreignPublishedProduct,
            id: 'own-1',
            companyId: 'company-1',
          },
        ],
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    const result = await service.checkCurateProducts('company-1', ['own-1']);
    expect(result.allowedProductIds).toEqual(['own-1']);
    expect(result.blocked).toEqual([]);
  });
});

describe('CollectionService.remove', () => {
  it('archives and stamps the acting user', async () => {
    const collectionUpdate = vi.fn(async () => ({
      id: 'col-1',
      status: CollectionStatus.Archived,
      _count: { products: 2 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Published,
        }),
        update: collectionUpdate,
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await service.remove('company-1', 'u1', 'col-1');

    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CollectionStatus.Archived,
          updatedByUserId: 'u1',
          exploreActivityAt: null,
        }),
      }),
    );
  });
});

describe('CollectionService.setStatus hide', () => {
  it('returns a published collection to draft and clears explore activity', async () => {
    const collectionUpdate = vi.fn(async () => ({
      id: 'col-1',
      status: CollectionStatus.Draft,
      _count: { products: 2 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Published,
        }),
        update: collectionUpdate,
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await service.setStatus('company-1', 'u1', 'col-1', CollectionStatus.Draft);

    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CollectionStatus.Draft,
          exploreActivityAt: null,
        }),
      }),
    );
  });
});

describe('CollectionService.unarchive', () => {
  it('rejects restore — deleted collections cannot come back', async () => {
    const collectionUpdate = vi.fn(async () => ({
      id: 'col-1',
      status: CollectionStatus.Draft,
      _count: { products: 1 },
    }));
    const prisma = {
      collection: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({
            id: 'col-1',
            companyId: 'company-1',
            status: CollectionStatus.Archived,
            name: 'Wedding Edit',
          })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'col-1',
            companyId: 'company-1',
            status: CollectionStatus.Archived,
            name: 'Wedding Edit',
          }),
        update: collectionUpdate,
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await expect(service.unarchive('company-1', 'u1', 'col-1')).rejects.toMatchObject({
      response: { code: 'NOT_ALLOWED' },
    });
    expect(collectionUpdate).not.toHaveBeenCalled();
  });

  it('rejects unarchive even when the pack is not deleted', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
          name: 'Wedding Edit',
        }),
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);
    await expect(service.unarchive('company-1', 'u1', 'col-1')).rejects.toThrow();
  });

  it('rejects unarchive when another live pack uses the same name', async () => {
    const prisma = {
      collection: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({
            id: 'col-archived',
            companyId: 'company-1',
            status: CollectionStatus.Archived,
            name: 'Wedding Edit',
          })
          .mockResolvedValueOnce({ id: 'col-live', name: 'Wedding Edit' }),
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);
    await expect(service.unarchive('company-1', 'u1', 'col-archived')).rejects.toMatchObject({
      response: { code: 'NOT_ALLOWED' },
    });
  });
});

describe('CollectionService name uniqueness', () => {
  it('rejects create when a non-archived pack already uses the name', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'existing',
          name: 'Wedding Edit',
          kind: CollectionKind.Regular,
        }),
      },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    try {
      await service.create('company-1', 'u1', { name: 'wedding edit', categories: [] });
      throw new Error('expected conflict');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      expect((err as ConflictException).getResponse()).toMatchObject({
        code: 'COLLECTION_NAME_TAKEN',
        details: {
          collectionId: 'existing',
          name: 'Wedding Edit',
          kind: CollectionKind.Regular,
        },
      });
    }
  });

  it('name clash on a catalog says catalog, not collection', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'cat-1',
          name: 'Season book',
          kind: CollectionKind.Catalog,
        }),
      },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    try {
      await service.create('company-1', 'u1', { name: 'season book', categories: [] });
      throw new Error('expected conflict');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      const body = (err as ConflictException).getResponse() as { message: string };
      expect(body.message).toMatch(/catalog/);
      expect(body.message).not.toMatch(/collection/);
    }
  });
});

describe('CollectionService.ready', () => {
  it('rejects Ready — collections are Draft or Published', async () => {
    const collectionUpdate = vi.fn(async () => ({
      id: 'col-1',
      status: CollectionStatus.Ready,
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
        }),
        update: collectionUpdate,
      },
      collectionProduct: { count: async () => 2 },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await expect(service.markReady('company-1', 'u1', 'col-1')).rejects.toMatchObject({
      response: { code: 'NOT_ALLOWED' },
    });
    expect(collectionUpdate).not.toHaveBeenCalled();
  });
});

describe('CollectionService.publish', () => {
  it('publishes own draft members for trade without Explore-posting them', async () => {
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const collectionUpdate = vi.fn(async () => ({
      id: 'col-1',
      status: CollectionStatus.Published,
      endsAt: null,
      _count: { products: 1 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
          startsAt: null,
          endsAt: null,
        }),
        update: collectionUpdate,
        findUniqueOrThrow: async () => ({
          id: 'col-1',
          status: CollectionStatus.Published,
          endsAt: null,
          _count: { products: 1 },
        }),
      },
      company: {
        findUniqueOrThrow: async () => ({ canPublish: true }),
      },
      collectionProduct: {
        findMany: async () => [
          {
            productId: 'draft-1',
            product: {
              id: 'draft-1',
              companyId: 'company-1',
              audience: 'connections',
              audienceCompanyIds: [],
              allowForward: true,
              status: ProductStatus.Draft,
              postedToMarketAt: null,
            },
          },
        ],
      },
      product: {
        updateMany: productUpdateMany,
      },
      companySettings: {
        findUnique: async () => null,
        upsert: vi.fn(async () => ({})),
      },
    } as unknown as PrismaService;

    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await service.publish('company-1', 'u1', 'col-1', {
      audience: 'connections',
      rateVisibility: 'on_request',
      allowForward: true,
    });

    expect(productUpdateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['draft-1'] },
        companyId: 'company-1',
        status: ProductStatus.Draft,
      },
      data: expect.objectContaining({
        status: ProductStatus.Published,
        audience: 'connections',
      }),
    });
    const data = productUpdateMany.mock.calls[0]![0].data as Record<string, unknown>;
    expect(data).not.toHaveProperty('postedToMarketAt');
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'col-1' },
        data: expect.objectContaining({ status: CollectionStatus.Published }),
      }),
    );
  });

  it('returns draft when publish endsAt is already past', async () => {
    const pastEnds = new Date(Date.now() - 60_000);
    const publishedRow = {
      id: 'col-1',
      status: CollectionStatus.Published,
      endsAt: pastEnds,
      exploreActivityAt: new Date(),
      _count: { products: 1 },
    };
    const draftedRow = {
      ...publishedRow,
      status: CollectionStatus.Draft,
      exploreActivityAt: null,
    };
    const collectionUpdate = vi.fn(async () => publishedRow);
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const findUniqueOrThrow = vi.fn(async () => draftedRow);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
          startsAt: null,
          endsAt: null,
        }),
        update: collectionUpdate,
        updateMany,
        findUniqueOrThrow,
      },
      company: {
        findUniqueOrThrow: async () => ({ canPublish: true }),
      },
      collectionProduct: {
        findMany: async () => [
          {
            productId: 'p1',
            product: {
              id: 'p1',
              companyId: 'company-1',
              audience: 'connections',
              audienceCompanyIds: [],
              allowForward: true,
              status: ProductStatus.Published,
              postedToMarketAt: new Date(),
            },
          },
        ],
      },
      product: {
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
      companySettings: {
        findUnique: async () => null,
        upsert: vi.fn(async () => ({})),
      },
    } as unknown as PrismaService;

    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    const view = await service.publish('company-1', 'u1', 'col-1', {
      audience: 'connections',
      rateVisibility: 'on_request',
      allowForward: true,
      endsAt: pastEnds.toISOString(),
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'col-1', status: CollectionStatus.Published },
      data: { status: CollectionStatus.Draft, exploreActivityAt: null },
    });
    expect(view).toMatchObject({ status: CollectionStatus.Draft, exploreActivityAt: null });
  });

  it('rejects publish when the collection has no designs', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
          startsAt: null,
          endsAt: null,
        }),
      },
      company: {
        findUniqueOrThrow: async () => ({ canPublish: true }),
      },
      collectionProduct: {
        findMany: async () => [],
      },
    } as unknown as PrismaService;

    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(
      service.publish('company-1', 'u1', 'col-1', {
        audience: 'connections',
        rateVisibility: 'on_request',
        allowForward: true,
      }),
    ).rejects.toThrow(/at least one design/i);
  });

  it('rejects curated publish when audience is wider than a foreign member', async () => {
    const collectionUpdate = vi.fn(async () => ({}));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
          startsAt: null,
          endsAt: null,
        }),
        update: collectionUpdate,
      },
      company: {
        findUniqueOrThrow: async () => ({ canPublish: true, canRelist: false }),
      },
      collectionProduct: {
        findMany: async () => [
          {
            productId: 'foreign-1',
            product: {
              ...foreignPublishedProduct,
              audience: 'connections',
            },
          },
        ],
      },
      product: {
        findMany: async () => [{ ...foreignPublishedProduct, audience: 'connections' }],
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
      connection: {
        findMany: async () => [
          {
            companyLowId: 'company-1',
            companyHighId: 'other-co',
            status: 'active',
          },
        ],
      },
      follow: followSourceShop(),
    } as unknown as PrismaService;

    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(
      service.publish('company-1', 'u1', 'col-1', {
        audience: 'everyone',
        rateVisibility: 'on_request',
        allowForward: true,
      }),
    ).rejects.toSatisfy((error: unknown) => {
      expectBadRequestCode(error, 'CURATED_AUDIENCE_TOO_WIDE');
      return true;
    });
    expect(collectionUpdate).not.toHaveBeenCalled();
  });

  it('grants canRelist on first curated publish with consent', async () => {
    const companyUpdate = vi.fn(async () => ({}));
    const collectionUpdate = vi.fn(async () => ({
      id: 'col-1',
      status: CollectionStatus.Published,
      endsAt: null,
      _count: { products: 1 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
          startsAt: null,
          endsAt: null,
        }),
        update: collectionUpdate,
        findUniqueOrThrow: async () => ({
          id: 'col-1',
          status: CollectionStatus.Published,
          endsAt: null,
          _count: { products: 1 },
        }),
      },
      company: {
        findUniqueOrThrow: async () => ({ canPublish: false, canRelist: false }),
        findUnique: async () => ({ canPublish: false }),
        update: companyUpdate,
      },
      collectionProduct: {
        findMany: async () => [
          {
            productId: 'foreign-1',
            product: foreignPublishedProduct,
          },
        ],
      },
      product: {
        findMany: async () => [foreignPublishedProduct],
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
      connection: { findMany: async () => [] },
      follow: followSourceShop(),
      companySettings: {
        findUnique: async () => null,
        upsert: vi.fn(async () => ({})),
      },
    } as unknown as PrismaService;

    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await service.publish('company-1', 'u1', 'col-1', {
      audience: 'connections',
      rateVisibility: 'on_request',
      allowForward: true,
      consentToSell: true,
    });

    expect(companyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'company-1' },
        data: expect.objectContaining({ canPublish: true }),
      }),
    );
    expect(companyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'company-1' },
        data: expect.objectContaining({ canRelist: true }),
      }),
    );
    expect(collectionUpdate).toHaveBeenCalled();
  });

  it('clamps curated publish rateVisibility to on_request when a foreign source is on_request', async () => {
    const collectionUpdate = vi.fn(async () => ({
      id: 'col-1',
      status: CollectionStatus.Published,
      endsAt: null,
      _count: { products: 1 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
          startsAt: null,
          endsAt: null,
        }),
        update: collectionUpdate,
        findUniqueOrThrow: async () => ({
          id: 'col-1',
          status: CollectionStatus.Published,
          endsAt: null,
          _count: { products: 1 },
        }),
      },
      company: {
        findUniqueOrThrow: async () => ({ canPublish: true, canRelist: true }),
        update: vi.fn(async () => ({})),
      },
      collectionProduct: {
        findMany: async () => [
          {
            productId: 'foreign-1',
            product: {
              ...foreignPublishedProduct,
              rateVisibility: 'on_request',
            },
          },
        ],
      },
      product: {
        findMany: async () => [
          { ...foreignPublishedProduct, rateVisibility: 'on_request' },
        ],
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
      connection: { findMany: async () => [] },
      follow: followSourceShop(),
      companySettings: {
        findUnique: async () => null,
        upsert: vi.fn(async () => ({})),
      },
    } as unknown as PrismaService;

    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await service.publish('company-1', 'u1', 'col-1', {
      audience: 'connections',
      rateVisibility: 'visible',
      allowForward: true,
    });

    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rateVisibility: 'on_request' }),
      }),
    );
  });
});

describe('CollectionService.update', () => {
  it('returns draft when updating endsAt to a time already past', async () => {
    const pastEnds = new Date(Date.now() - 60_000);
    const publishedRow = {
      id: 'col-1',
      name: 'Pack',
      status: CollectionStatus.Published,
      startsAt: null,
      endsAt: pastEnds,
      exploreActivityAt: new Date(),
      _count: { products: 1 },
    };
    const draftedRow = {
      ...publishedRow,
      status: CollectionStatus.Draft,
      exploreActivityAt: null,
    };
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          name: 'Pack',
          status: CollectionStatus.Published,
          startsAt: null,
          endsAt: null,
        }),
        update: vi.fn(async () => publishedRow),
        updateMany,
        findUniqueOrThrow: vi.fn(async () => draftedRow),
      },
    } as unknown as PrismaService;

    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    const view = await service.update('company-1', 'u1', 'col-1', {
      endsAt: pastEnds.toISOString(),
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'col-1', status: CollectionStatus.Published },
      data: { status: CollectionStatus.Draft, exploreActivityAt: null },
    });
    expect(view).toMatchObject({ status: CollectionStatus.Draft, exploreActivityAt: null });
  });

  it('persists General Collection name and description only', async () => {
    const existing = {
      id: 'gc-1',
      companyId: 'company-1',
      name: 'General Collection',
      description: null,
      kind: CollectionKind.General,
      status: CollectionStatus.Published,
    };
    const update = vi.fn(async () => ({
      id: 'gc-1',
      name: 'Shop leftovers',
      description: 'Dangling designs.',
      kind: CollectionKind.General,
      products: [],
      _count: { products: 0 },
    }));
    const prisma = {
      collection: {
        findFirst: async (args?: { where?: { id?: unknown } }) =>
          typeof args?.where?.id === 'string' ? existing : null,
        update,
      },
      product: { count: async () => 2 },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await service.update('company-1', 'u1', 'gc-1', {
      name: 'Shop leftovers',
      description: 'Dangling designs.',
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Shop leftovers',
          description: 'Dangling designs.',
          updatedByUserId: 'u1',
        },
      }),
    );
  });

  it('clears General Collection description when the client sends null', async () => {
    const existing = {
      id: 'gc-1',
      companyId: 'company-1',
      name: 'General Collection',
      description: 'Dangling designs.',
      kind: CollectionKind.General,
      status: CollectionStatus.Published,
    };
    const update = vi.fn(async () => ({
      ...existing,
      description: null,
      products: [],
      _count: { products: 0 },
    }));
    const prisma = {
      collection: {
        findFirst: async (args?: { where?: { id?: unknown } }) =>
          typeof args?.where?.id === 'string' ? existing : null,
        update,
      },
      product: { count: async () => 2 },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await service.update('company-1', 'u1', 'gc-1', {
      description: null,
    } as { description: null });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'General Collection',
          description: null,
          updatedByUserId: 'u1',
        },
      }),
    );
  });

  it('rejects tags and rate on General Collection', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'gc-1',
          companyId: 'company-1',
          name: 'General Collection',
          kind: CollectionKind.General,
          status: CollectionStatus.Published,
        }),
      },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(
      service.update('company-1', 'u1', 'gc-1', { rate: 91 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('CollectionService categories', () => {
  it('persists categories on create', async () => {
    const create = vi.fn(async (args: { data: { categories: string[] } }) => ({
      id: 'col-1',
      ...args.data,
      products: [],
      _count: { products: 0 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => null,
        create,
      },
      companySettings: {
        findUnique: async () => null,
        upsert: vi.fn(async () => ({})),
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);

    await service.create('company-1', 'u1', {
      name: 'Wedding Edit',
      categories: ['Bedsheet', 'Bed Linen'],
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categories: ['Bedsheet', 'Bed Linen'],
        }),
      }),
    );
  });

  it('updates categories when provided', async () => {
    const update = vi.fn(async () => ({
      id: 'col-1',
      categories: ['Towels'],
      products: [],
      _count: { products: 0 },
    }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          name: 'Pack',
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

    await service.update('company-1', 'u1', 'col-1', { categories: ['Towels'] });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categories: ['Towels'] }),
      }),
    );
  });
});

describe('CollectionService.create repost source', () => {
  it('stamps peer collection source on create', async () => {
    const create = vi.fn(async (args: { data: Record<string, unknown> }) => ({
      id: 'mine',
      ...args.data,
      products: [],
      _count: { products: 0 },
    }));
    const prisma = {
      collection: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null) // name available
          .mockResolvedValueOnce(null), // no prior repost
        findUnique: async () => ({
          id: 'src-col',
          companyId: 'peer',
          status: CollectionStatus.Published,
        }),
        create,
      },
      companySettings: {
        findUnique: async () => null,
        upsert: vi.fn(async () => ({})),
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (row: { id: string }) => ({ id: row.id }),
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer, jobs);
    await service.create('me', 'u1', {
      name: 'My Repost',
      categories: [],
      repostSourceCollectionId: 'src-col',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          repostSourceCollectionId: 'src-col',
          repostSourceProductId: null,
        }),
      }),
    );
  });

  it('rejects second repost of the same collection', async () => {
    const prisma = {
      collection: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null) // name
          .mockResolvedValueOnce({ id: 'already' }), // prior stamp
        findUnique: async () => ({
          id: 'src-col',
          companyId: 'peer',
          status: CollectionStatus.Published,
        }),
      },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(
      service.create('me', 'u1', {
        name: 'Again',
        categories: [],
        repostSourceCollectionId: 'src-col',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects reposting own pack', async () => {
    const prisma = {
      collection: {
        findFirst: async () => null,
        findUnique: async () => ({
          id: 'src-col',
          companyId: 'me',
          status: CollectionStatus.Published,
        }),
      },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(
      service.create('me', 'u1', {
        name: 'Own',
        categories: [],
        repostSourceCollectionId: 'src-col',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('peerRepostOmitsCategoryPick', () => {
  it('skips the Category pick only for peer Repost packs', () => {
    expect(peerRepostOmitsCategoryPick({ repostSourceCollectionId: 'src' })).toBe(true);
    expect(peerRepostOmitsCategoryPick({ repostSourceProductId: 'p1' })).toBe(true);
    expect(peerRepostOmitsCategoryPick({})).toBe(false);
  });
});

describe('CollectionService.create peer Repost', () => {
  it('reuses a leftover draft instead of already-reposted', async () => {
    const update = vi.fn(async (args: { where: { id: string } }) => ({
      id: args.where.id,
      name: 'Retry',
      _count: { products: 0 },
      products: [],
    }));
    const prisma = {
      collection: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'draft-1', status: CollectionStatus.Draft }),
        findUnique: async () => ({
          id: 'src-col',
          companyId: 'peer',
          status: CollectionStatus.Published,
          masterCategoryId: 'cat-mill',
        }),
        update,
      },
    } as unknown as PrismaService;
    const serializer = {
      toCollectionView: (row: { id: string }) => ({ id: row.id }),
    } as unknown as CatalogSerializer;
    const masterData = {
      resolveCategoryIdForCompany: vi.fn(async () => 'cat-mill'),
    };
    const service = new CollectionService(
      prisma,
      serializer,
      jobs,
      masterData as never,
    );
    const view = await service.create('me', 'u1', {
      name: 'Retry',
      categories: [],
      repostSourceCollectionId: 'src-col',
    });
    expect(view).toMatchObject({ id: 'draft-1' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'draft-1' },
        data: expect.objectContaining({ masterCategoryId: 'cat-mill' }),
      }),
    );
  });
});

describe('CollectionService.otherPackCounts', () => {
  it('counts memberships in other non-archived packs', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-a',
          companyId: 'company-1',
          status: CollectionStatus.Published,
        }),
      },
      collectionProduct: {
        findMany: async () => [
          { productId: 'p1' },
          { productId: 'p1' },
          { productId: 'p2' },
        ],
      },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    const result = await service.otherPackCounts('company-1', 'col-a', ['p1', 'p2', 'p3']);
    expect(result.counts).toEqual([
      { productId: 'p1', otherPackCount: 2 },
      { productId: 'p2', otherPackCount: 1 },
      { productId: 'p3', otherPackCount: 0 },
    ]);
  });
});

describe('CollectionService.publishMembers', () => {
  it('publishes own draft members without postedToMarketAt and stamps pack Who', async () => {
    const productUpdateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          kind: 'regular',
          audience: 'followers',
          rateVisibility: 'on_request',
          audienceCompanyIds: [],
          audienceGroupIds: [],
          allowForward: true,
          allowDownload: false,
        }),
      },
      company: { findUnique: async () => ({ canPublish: true }) },
      collectionProduct: {
        findMany: async () => [{ productId: 'p1' }],
      },
      product: { updateMany: productUpdateMany },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.publishMembers('company-1', 'u1', 'col-1', ['p1'])).resolves.toEqual({
      published: 1,
    });
    expect(productUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProductStatus.Published,
          audience: 'followers',
          rateVisibility: 'on_request',
        }),
      }),
    );
    expect(productUpdateMany.mock.calls[0]?.[0]?.data).not.toHaveProperty('postedToMarketAt');
  });

  it('blocks when the company cannot publish', async () => {
    const productUpdateMany = vi.fn();
    const prisma = {
      collection: {
        findFirst: async () => ({ id: 'col-1', companyId: 'company-1', kind: 'regular' }),
      },
      company: { findUnique: async () => ({ canPublish: false }) },
      product: { updateMany: productUpdateMany },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(service.publishMembers('company-1', 'u1', 'col-1', ['p1'])).rejects.toThrow();
    expect(productUpdateMany).not.toHaveBeenCalled();
  });
});
