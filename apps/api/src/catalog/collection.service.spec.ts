import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import { CollectionService } from './collection.service';
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

  it('does not bump when newly added designs are still draft', async () => {
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
    const updateData = collectionUpdate.mock.calls[0][0].data as Record<string, unknown>;
    expect(updateData.updatedByUserId).toBe('u1');
    expect(updateData.exploreActivityAt).toBeUndefined();
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
      follow: { findMany: async () => [] },
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
      collectionProduct: { findMany: async () => [] },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(
      service.setProducts('company-1', 'u1', 'col-1', ['foreign-1']),
    ).rejects.toSatisfy((error: unknown) => {
      expectBadRequestCode(error, 'FORWARD_NOT_ALLOWED');
      return true;
    });
    expect(transaction).not.toHaveBeenCalled();
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
  it('restores an archived collection to draft', async () => {
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

    await service.unarchive('company-1', 'u1', 'col-1');
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CollectionStatus.Draft,
          exploreActivityAt: null,
        }),
      }),
    );
  });

  it('rejects unarchive when not archived', async () => {
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
    await expect(service.unarchive('company-1', 'u1', 'col-archived')).rejects.toThrow(
      /Restore blocked/i,
    );
  });
});

describe('CollectionService name uniqueness', () => {
  it('rejects create when a non-archived pack already uses the name', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({ id: 'existing', name: 'Wedding Edit' }),
      },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs);
    await expect(
      service.create('company-1', 'u1', { name: 'wedding edit' }),
    ).rejects.toThrow(/already have a collection/i);
  });
});

describe('CollectionService.ready', () => {
  it('marks a draft collection ready', async () => {
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

    await service.markReady('company-1', 'u1', 'col-1');
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CollectionStatus.Ready,
          exploreActivityAt: null,
        }),
      }),
    );
  });
});

describe('CollectionService.publish', () => {
  it('auto-publishes draft members then publishes the collection', async () => {
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
        postedToMarketAt: expect.any(Date),
        audience: 'connections',
      }),
    });
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
          { ownerCompanyId: 'other-co', status: 'active' },
        ],
      },
      follow: { findMany: async () => [] },
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
      follow: { findMany: async () => [] },
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
      follow: { findMany: async () => [] },
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
});
