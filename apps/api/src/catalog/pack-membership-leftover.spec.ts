import { describe, expect, it, vi } from 'vitest';
import {
  CollectionKind,
  CollectionStatus,
  ProductStatus,
} from '@ekum/domain-types';
import { CollectionService } from './collection.service';
import { generalMemberProductWhere, qualifyingCollectionWhere } from './general-collection';
import { isPackMembershipLeftover } from './pack-membership-leftover';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';
import type { JobQueue } from '../jobs/job-queue.service';

const jobs = { enqueue: vi.fn(async () => 'job-1') } as unknown as JobQueue;

describe('pack membership leftover (regression)', () => {
  it('sole collection remove → leftover eligible for GC', () => {
    expect(
      isPackMembershipLeftover({
        productStatus: ProductStatus.Published,
        joins: [],
      }),
    ).toBe(true);
  });

  it('still in C2 after remove from C1 → not GC', () => {
    expect(
      isPackMembershipLeftover({
        productStatus: ProductStatus.Published,
        joins: [
          { kind: CollectionKind.Regular, collectionStatus: CollectionStatus.Published },
        ],
      }),
    ).toBe(false);
  });

  it('remove from last remaining collection → GC', () => {
    expect(
      isPackMembershipLeftover({
        productStatus: ProductStatus.Published,
        joins: [
          { kind: CollectionKind.Regular, collectionStatus: CollectionStatus.Published },
        ],
      }),
    ).toBe(false);
    expect(
      isPackMembershipLeftover({
        productStatus: ProductStatus.Published,
        joins: [],
      }),
    ).toBe(true);
  });

  it('Draft collection membership still counts as assigned (blocks GC)', () => {
    expect(
      isPackMembershipLeftover({
        productStatus: ProductStatus.Published,
        joins: [{ kind: CollectionKind.Regular, collectionStatus: CollectionStatus.Draft }],
      }),
    ).toBe(false);
    const where = qualifyingCollectionWhere('co-1');
    expect(where.status).toEqual({ not: CollectionStatus.Archived });
    expect(where.kind).toEqual({
      in: [CollectionKind.Regular, CollectionKind.Catalog],
    });
  });

  it('catalog join blocks GC; archived product never GC', () => {
    expect(
      isPackMembershipLeftover({
        productStatus: ProductStatus.Published,
        joins: [{ kind: CollectionKind.Catalog, collectionStatus: CollectionStatus.Published }],
      }),
    ).toBe(false);
    expect(
      isPackMembershipLeftover({
        productStatus: ProductStatus.Archived,
        joins: [],
      }),
    ).toBe(false);
  });

  it('generalMemberProductWhere matches leftover rule shape', () => {
    const where = generalMemberProductWhere('co-1');
    expect(where).toMatchObject({
      companyId: 'co-1',
      status: { not: ProductStatus.Archived },
      collections: {
        none: {
          collection: qualifyingCollectionWhere('co-1'),
        },
      },
    });
  });

  it('regular setProducts empty keep-set deletes joins for that pack only', async () => {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const createMany = vi.fn(async () => ({ count: 0 }));
    const collectionUpdate = vi.fn(async () => ({}));
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'c1',
          companyId: 'company-1',
          kind: CollectionKind.Regular,
          status: CollectionStatus.Published,
        }),
        update: collectionUpdate,
      },
      product: {
        findMany: async () => [],
        count: async () => 0,
      },
      collectionProduct: {
        findMany: vi.fn(async () => [{ productId: 'p1' }]),
        deleteMany,
        createMany,
      },
      connection: { findMany: async () => [] },
      follow: { findMany: async () => [] },
      productRelistGrant: { findMany: async () => [] },
      $transaction: async (ops: unknown) => {
        if (Array.isArray(ops)) {
          await Promise.all(ops as Promise<unknown>[]);
        }
      },
    } as unknown as PrismaService;
    const service = new CollectionService(
      prisma,
      { toCollectionDetail: () => ({ id: 'c1', products: [] }) } as unknown as CatalogSerializer,
      jobs,
    );
    vi.spyOn(service, 'get').mockResolvedValue({ id: 'c1', products: [] } as never);
    await service.setProducts('company-1', 'u1', 'c1', []);
    expect(deleteMany).toHaveBeenCalledWith({ where: { collectionId: 'c1' } });
    expect(createMany).not.toHaveBeenCalled();
  });

  it('GC get loads leftovers via generalMemberProductWhere (API response path)', async () => {
    const leftover = {
      id: 'p1',
      createdAt: new Date('2026-10-24T00:00:00.000Z'),
      name: 'Saree',
      company: { id: 'company-1', name: 'Ravi' },
    };
    const findMany = vi.fn(async () => [leftover]);
    const prisma = {
      collection: {
        findFirst: async () => ({
          id: 'gc-1',
          companyId: 'company-1',
          kind: CollectionKind.General,
          status: CollectionStatus.Published,
        }),
        findUniqueOrThrow: async () => ({
          id: 'gc-1',
          kind: CollectionKind.General,
          products: [],
        }),
      },
      product: { findMany },
    } as unknown as PrismaService;
    const toCollectionDetail = vi.fn((row: { products: unknown[] }) => ({
      id: 'gc-1',
      kind: CollectionKind.General,
      products: row.products,
    }));
    const service = new CollectionService(
      prisma,
      { toCollectionDetail } as unknown as CatalogSerializer,
      jobs,
    );
    const detail = await service.get('company-1', 'gc-1');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: generalMemberProductWhere('company-1'),
      }),
    );
    expect(detail.products).toEqual([
      expect.objectContaining({ productId: 'p1', product: leftover }),
    ]);
  });
});
