import { BadRequestException } from '@nestjs/common';
import { CatalogOrderMode, CollectionKind, ProductStatus } from '@ekum/domain-types';
import { describe, expect, it, vi } from 'vitest';
import {
  assertExclusiveWholeCatalogComplete,
  CATALOG_WHOLE_REQUIRED,
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
