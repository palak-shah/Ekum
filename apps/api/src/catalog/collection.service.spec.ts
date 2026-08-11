import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import { CollectionService } from './collection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';

describe('CollectionService.setProducts', () => {
  it('rejects products that do not belong to the acting company', async () => {
    const transaction = vi.fn(async () => []);
    const prisma = {
      collection: { findFirst: async () => ({ id: 'col-1', companyId: 'company-1', status: 'draft' }) },
      // Only one of the two requested products belongs to the company.
      product: { count: async () => 1 },
      $transaction: transaction,
    } as unknown as PrismaService;
    const serializer = {} as unknown as CatalogSerializer;

    const service = new CollectionService(prisma, serializer);
    await expect(service.setProducts('company-1', 'col-1', ['p1', 'p2'])).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('hides collections owned by another company', async () => {
    const prisma = {
      collection: { findFirst: async () => null },
    } as unknown as PrismaService;
    const service = new CollectionService(prisma, {} as unknown as CatalogSerializer);
    await expect(service.setProducts('company-1', 'col-1', ['p1'])).rejects.toThrow();
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
        count: vi
          .fn()
          .mockResolvedValueOnce(2) // ownership check (both ids)
          .mockResolvedValueOnce(1), // newly added published count
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
    const service = new CollectionService(prisma, serializer);
    // Stub get via prototype path used after setProducts
    vi.spyOn(service, 'get').mockImplementation(getSpy as never);

    await service.setProducts('company-1', 'col-1', ['old', 'new-published']);

    expect(transaction).toHaveBeenCalled();
    const ops = transaction.mock.calls[0][0] as unknown[];
    expect(ops.length).toBe(3); // delete + create + bump
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
        count: vi.fn().mockResolvedValue(1),
      },
      collectionProduct: {
        findMany: async () => [{ productId: 'a' }, { productId: 'b' }],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(prisma, {
      toCollectionDetail: () => ({ id: 'col-1' }),
    } as unknown as CatalogSerializer);
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);

    await service.setProducts('company-1', 'col-1', ['a']);

    const ops = transaction.mock.calls[0][0] as unknown[];
    expect(ops.length).toBe(2); // delete + create only
    expect(collectionUpdate).not.toHaveBeenCalled();
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
        count: vi
          .fn()
          .mockResolvedValueOnce(1) // ownership
          .mockResolvedValueOnce(0), // no published among newly added
      },
      collectionProduct: {
        findMany: async () => [],
        deleteMany: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new CollectionService(prisma, {
      toCollectionDetail: () => ({ id: 'col-1' }),
    } as unknown as CatalogSerializer);
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'col-1' } as never);

    await service.setProducts('company-1', 'col-1', ['draft-1']);

    const ops = transaction.mock.calls[0][0] as unknown[];
    expect(ops.length).toBe(2);
    expect(collectionUpdate).not.toHaveBeenCalled();
    expect(ProductStatus.Published).toBe('published');
  });
});

describe('CollectionService.setStatus hide', () => {
  it('returns a published collection to draft without requiring members', async () => {
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
    const service = new CollectionService(prisma, serializer);

    await service.setStatus('company-1', 'col-1', CollectionStatus.Draft);

    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: CollectionStatus.Draft },
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
      _count: { products: 1 },
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
      company: {
        findUniqueOrThrow: async () => ({ canPublish: true }),
      },
      collectionProduct: {
        findMany: async () => [{ productId: 'draft-1' }],
      },
      product: {
        updateMany: productUpdateMany,
      },
    } as unknown as PrismaService;

    const serializer = {
      toCollectionView: (c: unknown) => c,
    } as unknown as CatalogSerializer;
    const service = new CollectionService(prisma, serializer);

    await service.publish('company-1', 'col-1', {
      audience: 'connections',
      rateVisibility: 'on_request',
    });

    expect(productUpdateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['draft-1'] },
        companyId: 'company-1',
        status: ProductStatus.Draft,
      },
      data: { status: ProductStatus.Published },
    });
    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'col-1' },
        data: expect.objectContaining({ status: CollectionStatus.Published }),
      }),
    );
  });

  it('rejects publish when the collection has no designs', async () => {
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'col-1',
          companyId: 'company-1',
          status: CollectionStatus.Draft,
        }),
      },
      company: {
        findUniqueOrThrow: async () => ({ canPublish: true }),
      },
      collectionProduct: {
        findMany: async () => [],
      },
    } as unknown as PrismaService;

    const service = new CollectionService(prisma, {} as unknown as CatalogSerializer);
    await expect(
      service.publish('company-1', 'col-1', {
        audience: 'connections',
        rateVisibility: 'on_request',
      }),
    ).rejects.toThrow(/at least one design/i);
  });
});
