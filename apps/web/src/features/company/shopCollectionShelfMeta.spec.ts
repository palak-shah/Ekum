import { shopCollectionShelfMeta, memberShopsFromSourceNames } from './shopCollectionShelfMeta';
import type { CollectionCard } from '@ekum/domain-types';

function card(partial: Partial<CollectionCard> & Pick<CollectionCard, 'id' | 'name'>): CollectionCard {
  return {
    description: null,
    categories: [],
    memberFind: [],
    coverImage: null,
    previewImages: [],
    imageCount: 0,
    productCount: 1,
    status: 'published',
    updatedAt: new Date().toISOString(),
    allowForward: true,
    orderPathPreference: null,
    rateMin: null,
    rateMax: null,
    rateUnit: null,
    exploreNewDesignCount: 0,
    showSourceShops: false,
    sourceShopNames: [],
    viewerReposted: false,
    company: { id: 'buyer', name: 'Buyer 1', city: '', verification: 'unverified', logoUrl: null, sellCategories: [] },
    ...partial,
  };
}

describe('shopCollectionShelfMeta', () => {
  it('own shelf always shows library memberShops (From mill)', () => {
    const meta = shopCollectionShelfMeta({
      isOwn: true,
      collection: card({ id: 'c1', name: 'Pack', showSourceShops: false }),
      libraryMemberShops: [{ id: 's1', name: 'Supplier 1' }],
    });
    expect(meta.hideLibraryMeta).toBe(false);
    expect(meta.memberShops).toEqual([{ id: 's1', name: 'Supplier 1' }]);
  });

  it('visitor with show off hides mill From', () => {
    const meta = shopCollectionShelfMeta({
      isOwn: false,
      collection: card({
        id: 'c1',
        name: 'Pack',
        showSourceShops: false,
        sourceShopNames: [],
      }),
    });
    expect(meta.hideLibraryMeta).toBe(true);
  });

  it('visitor with show on shows ceiling-safe From names', () => {
    const meta = shopCollectionShelfMeta({
      isOwn: false,
      collection: card({
        id: 'c1',
        name: 'Pack',
        showSourceShops: true,
        sourceShopNames: ['Trader 1'],
      }),
    });
    expect(meta.hideLibraryMeta).toBe(false);
    expect(meta.memberShops).toEqual(memberShopsFromSourceNames(['Trader 1']));
  });
});
