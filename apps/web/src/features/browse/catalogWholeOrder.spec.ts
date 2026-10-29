import { CatalogOrderMode, CollectionKind, ProductStatus, type ProductView } from '@ekum/domain-types';
import { describe, expect, it } from 'vitest';
import {
  expandPreviewMembers,
  expandWholeCatalogsInShortlist,
  isExclusiveWholeCatalogMember,
  isWholeCatalogOrder,
  needsOrderResolveChoice,
  publishedOrderMembers,
  resolveCatalogOrderAlbums,
  shortlistCatalogIdsToExpand,
} from './catalogWholeOrder';
import type { CatalogWholeOrderPreview } from './catalogWholeOrder';

function member(id: string, status: string, name = id): ProductView {
  return {
    id,
    name,
    images: [],
    companyId: 'c1',
    companyName: 'Shop',
    allowForward: true,
    status,
    categories: [],
  } as unknown as ProductView;
}

function preview(over: Partial<CatalogWholeOrderPreview> = {}): CatalogWholeOrderPreview {
  return {
    id: 'cat-1',
    name: 'Season',
    kind: CollectionKind.Catalog,
    orderMode: CatalogOrderMode.Whole,
    allowForward: true,
    company: { id: 'c1', name: 'Shop' },
    products: [member('p1', ProductStatus.Published, 'Silk'), member('p2', ProductStatus.Draft, 'Draft silk')],
    ...over,
  };
}

describe('isExclusiveWholeCatalogMember', () => {
  it('is true only for exclusive members of a whole catalog', () => {
    expect(
      isExclusiveWholeCatalogMember({
        catalogCollectionId: 'cat-1',
        catalogOrderMode: CatalogOrderMode.Whole,
      }),
    ).toBe(true);
    expect(
      isExclusiveWholeCatalogMember({
        catalogCollectionId: 'cat-1',
        catalogOrderMode: CatalogOrderMode.Pick,
      }),
    ).toBe(false);
    expect(
      isExclusiveWholeCatalogMember({
        catalogCollectionId: null,
        catalogOrderMode: CatalogOrderMode.Whole,
      }),
    ).toBe(false);
  });
});

describe('isWholeCatalogOrder', () => {
  it('is true only for catalog + whole', () => {
    expect(isWholeCatalogOrder({ kind: CollectionKind.Catalog, orderMode: CatalogOrderMode.Whole })).toBe(
      true,
    );
    expect(isWholeCatalogOrder({ kind: CollectionKind.Catalog, orderMode: CatalogOrderMode.Pick })).toBe(
      false,
    );
    expect(isWholeCatalogOrder({ kind: CollectionKind.Regular, orderMode: CatalogOrderMode.Whole })).toBe(
      false,
    );
    expect(isWholeCatalogOrder({ kind: CollectionKind.Catalog, orderMode: null })).toBe(false);
    expect(isWholeCatalogOrder({})).toBe(false);
  });
});

describe('needsOrderResolveChoice', () => {
  it('skips the sheet when every album is a whole catalog', () => {
    expect(
      needsOrderResolveChoice([
        { kind: CollectionKind.Catalog, orderMode: CatalogOrderMode.Whole },
        { kind: CollectionKind.Catalog, orderMode: CatalogOrderMode.Whole },
      ]),
    ).toBe(false);
  });

  it('keeps the sheet for pick, regular, or unknown mode', () => {
    expect(
      needsOrderResolveChoice([{ kind: CollectionKind.Catalog, orderMode: CatalogOrderMode.Pick }]),
    ).toBe(true);
    expect(needsOrderResolveChoice([{ kind: CollectionKind.Regular }])).toBe(true);
    expect(needsOrderResolveChoice([{ kind: CollectionKind.Catalog }])).toBe(true);
    expect(needsOrderResolveChoice([])).toBe(false);
  });
});

describe('publishedOrderMembers', () => {
  it('returns null when the pack is locked', () => {
    expect(publishedOrderMembers(null)).toBeNull();
  });

  it('drops drafts and keeps rows with no status', () => {
    const members = publishedOrderMembers([
      ...(preview().products ?? []),
      member('p9', '', 'Bare'),
    ]);
    expect(members?.map((row) => row.id)).toEqual(['p1', 'p9']);
  });
});

describe('expandPreviewMembers', () => {
  it('stamps source collection on published members only', () => {
    const rows = expandPreviewMembers(preview(), {
      collectionId: 'cat-1',
      companyId: 'c1',
      companyName: 'Shop',
      allowForward: true,
      name: 'Season',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      productId: 'p1',
      sourceCollectionId: 'cat-1',
    });
  });
});

describe('shortlistCatalogIdsToExpand', () => {
  it('collects exclusive and from-pack ids', () => {
    expect(
      shortlistCatalogIdsToExpand([
        {
          productId: 'a',
          name: 'A',
          thumbUrl: null,
          companyId: 'c1',
          companyName: 'Shop',
          catalogCollectionId: 'cat-1',
        },
        {
          productId: 'b',
          name: 'B',
          thumbUrl: null,
          companyId: 'c1',
          companyName: 'Shop',
          sourceCollectionId: 'cat-1',
        },
      ]),
    ).toEqual(['cat-1']);
  });
});

describe('expandWholeCatalogsInShortlist', () => {
  it('expands an exclusive whole-catalog design into all published members', async () => {
    const result = await expandWholeCatalogsInShortlist(
      [
        {
          productId: 'p1',
          name: 'Silk',
          thumbUrl: null,
          companyId: 'c1',
          companyName: 'Shop',
          catalogCollectionId: 'cat-1',
        },
      ],
      async () =>
        preview({
          products: [
            member('p1', ProductStatus.Published, 'Silk'),
            member('p3', ProductStatus.Published, 'Cotton'),
          ],
        }),
    );
    expect(result.shortlist.map((row) => row.productId)).toEqual(['p1', 'p3']);
    expect(result.lockedProductIds).toEqual(['p1', 'p3']);
    expect(result.shortlist.every((row) => row.catalogWhole === true)).toBe(true);
  });

  it('does not expand a pick catalog', async () => {
    const result = await expandWholeCatalogsInShortlist(
      [
        {
          productId: 'p1',
          name: 'Silk',
          thumbUrl: null,
          companyId: 'c1',
          companyName: 'Shop',
          catalogCollectionId: 'cat-1',
        },
      ],
      async () => preview({ orderMode: CatalogOrderMode.Pick }),
    );
    expect(result.shortlist).toHaveLength(1);
    expect(result.lockedProductIds).toEqual([]);
  });
});

describe('resolveCatalogOrderAlbums', () => {
  const album = {
    collectionId: 'cat-1',
    name: 'Season',
    coverImage: null,
    companyId: 'c1',
    companyName: 'Shop',
    kind: CollectionKind.Catalog,
    orderMode: CatalogOrderMode.Whole,
  };

  it('forces whole catalogs to All even when Choose is selected', async () => {
    const result = await resolveCatalogOrderAlbums({
      albums: [album],
      existingShortlist: [],
      choices: { 'cat-1': 'choose' },
      emptyMessage: 'Pick at least one design to order.',
      fetchPreview: async () => preview(),
    });
    expect(result.navigateToCollectionId).toBeNull();
    expect(result.shortlist.map((row) => row.productId)).toEqual(['p1']);
    expect(result.lockedProductIds).toEqual(['p1']);
  });

  it('opens the album for Choose on a pick catalog', async () => {
    const result = await resolveCatalogOrderAlbums({
      albums: [{ ...album, orderMode: CatalogOrderMode.Pick }],
      existingShortlist: [],
      choices: { 'cat-1': 'choose' },
      emptyMessage: 'Pick at least one design to order.',
      fetchPreview: async () => preview({ orderMode: CatalogOrderMode.Pick }),
    });
    expect(result.navigateToCollectionId).toBe('cat-1');
    expect(result.shortlist).toEqual([]);
  });
});
