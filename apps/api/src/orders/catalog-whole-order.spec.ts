import { BadRequestException } from '@nestjs/common';
import { CatalogOrderMode, CollectionKind, ProductStatus } from '@ekum/domain-types';
import { describe, expect, it, vi } from 'vitest';
import { catalogWholeChatMeta } from '@ekum/domain-types';
import {
  assertCatalogWholeDecisionTogether,
  assertEqualWholeCatalogQuantities,
  assertExclusiveWholeCatalogComplete,
  CATALOG_WHOLE_QTY,
  CATALOG_WHOLE_REQUIRED,
  CATALOG_WHOLE_SPLIT,
  fanOutCatalogWholeLines,
  missingWholeCatalogMembers,
} from './catalog-whole-order';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('missingWholeCatalogMembers', () => {
  it('ignores pick catalogs and regular collections', () => {
    expect(
      missingWholeCatalogMembers({
        kind: CollectionKind.Catalog,
        orderMode: CatalogOrderMode.Pick,
        name: 'Season',
        publishedMemberIds: ['a', 'b'],
        orderedIds: ['a'],
      }),
    ).toBeNull();
    expect(
      missingWholeCatalogMembers({
        kind: CollectionKind.Regular,
        orderMode: CatalogOrderMode.Whole,
        name: 'Wedding',
        publishedMemberIds: ['a', 'b'],
        orderedIds: ['a'],
      }),
    ).toBeNull();
  });

  it('requires every published member on a whole catalog', () => {
    expect(
      missingWholeCatalogMembers({
        kind: CollectionKind.Catalog,
        orderMode: CatalogOrderMode.Whole,
        name: 'Season',
        publishedMemberIds: ['a', 'b'],
        orderedIds: ['a'],
      }),
    ).toEqual({
      code: CATALOG_WHOLE_REQUIRED,
      message: 'Season is ordered as a whole.',
    });
    expect(
      missingWholeCatalogMembers({
        kind: CollectionKind.Catalog,
        orderMode: CatalogOrderMode.Whole,
        name: 'Season',
        publishedMemberIds: ['a', 'b'],
        orderedIds: ['a', 'b'],
      }),
    ).toBeNull();
  });
});

describe('assertExclusiveWholeCatalogComplete', () => {
  it('rejects a cherry-pick of exclusive whole-catalog designs', async () => {
    const prisma = {
      product: {
        findMany: vi.fn(async () => [{ id: 'p1', catalogCollectionId: 'cat-1' }]),
      },
      collection: {
        findMany: vi.fn(async () => [
          {
            id: 'cat-1',
            name: 'Season',
            products: [
              { productId: 'p1', product: { status: ProductStatus.Published } },
              { productId: 'p2', product: { status: ProductStatus.Published } },
            ],
          },
        ]),
      },
    } as unknown as PrismaService;

    await expect(assertExclusiveWholeCatalogComplete(prisma, ['p1'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('allows mill designs that are not exclusive to a whole catalog', async () => {
    const prisma = {
      product: {
        findMany: vi.fn(async () => [{ id: 'p1', catalogCollectionId: null }]),
      },
      collection: { findMany: vi.fn() },
    } as unknown as PrismaService;

    await expect(assertExclusiveWholeCatalogComplete(prisma, ['p1'])).resolves.toBeUndefined();
    expect(prisma.collection.findMany).not.toHaveBeenCalled();
  });
});

describe('assertEqualWholeCatalogQuantities', () => {
  const stamps = new Map([
    ['p1', { catalogCollectionId: 'cat-1', catalogName: 'Season', catalogWhole: true as const }],
    ['p2', { catalogCollectionId: 'cat-1', catalogName: 'Season', catalogWhole: true as const }],
  ]);

  it('rejects mixed qty on a whole catalog', () => {
    try {
      assertEqualWholeCatalogQuantities(
        [
          { productId: 'p1', quantity: 1 },
          { productId: 'p2', quantity: 2 },
        ],
        stamps,
      );
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toMatchObject({
        code: CATALOG_WHOLE_QTY,
      });
    }
  });

  it('allows the same qty on every member', () => {
    expect(() =>
      assertEqualWholeCatalogQuantities(
        [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 2 },
        ],
        stamps,
      ),
    ).not.toThrow();
  });
});

describe('fanOutCatalogWholeLines', () => {
  const items = [
    { id: 'a', catalogCollectionId: 'cat-1', catalogName: 'Season', catalogWhole: true },
    { id: 'b', catalogCollectionId: 'cat-1', catalogName: 'Season', catalogWhole: true },
    { id: 'c', catalogWhole: false },
  ];

  it('copies one line onto every peer', () => {
    expect(fanOutCatalogWholeLines(items, [{ orderItemId: 'a', quantity: 3 }])).toEqual([
      { orderItemId: 'a', quantity: 3 },
      { orderItemId: 'b', quantity: 3 },
    ]);
  });

  it('chat meta collapses the catalog and keeps loose lines', () => {
    expect(catalogWholeChatMeta(items)).toEqual({
      itemCount: 2,
      catalogCount: 1,
      catalogName: 'Season',
    });
    expect(catalogWholeChatMeta(items.filter((item) => item.catalogWhole))).toEqual({
      itemCount: 1,
      catalogCount: 1,
      catalogName: 'Season',
    });
  });

  it('rejects split confirm', () => {
    try {
      assertCatalogWholeDecisionTogether(items, [
        { orderItemId: 'a', action: 'confirm' },
        { orderItemId: 'b', action: 'decline' },
      ]);
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toMatchObject({
        code: CATALOG_WHOLE_SPLIT,
      });
    }
  });
});
