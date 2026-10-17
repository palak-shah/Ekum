import { describe, expect, it } from 'vitest';
import {
  companyIdFromPath,
  shouldShowShopTradeDock,
  shopAlbumEntries,
  shopSelectedCount,
  shopShortlistEntries,
  shopTabSelectedCount,
} from './shopTradeDock';

const surat = {
  productId: 's1',
  name: 'Silk',
  thumbUrl: null,
  companyId: 'ravi',
  companyName: 'Surat Silk House',
};
const jaipur = {
  productId: 'j1',
  name: 'Block',
  thumbUrl: null,
  companyId: 'meena',
  companyName: 'Jaipur Emporium',
};

describe('shopShortlistEntries', () => {
  it('keeps every line for this shop, wherever it was picked', () => {
    expect(shopShortlistEntries([jaipur, surat, { ...surat, productId: 's2' }], 'ravi')).toEqual([
      surat,
      { ...surat, productId: 's2' },
    ]);
  });
});

describe('shopAlbumEntries', () => {
  it('clears a pack that is on this shop even if it was stored under another company', () => {
    const pack = {
      collectionId: 'a1',
      name: 'A+B pack',
      coverImage: null,
      companyId: 'other',
      companyName: 'Other',
    };
    expect(shopAlbumEntries([pack], 'jaipur', ['a1'])).toEqual([pack]);
    expect(shopAlbumEntries([pack], 'jaipur', [])).toEqual([]);
  });

  it('keeps this shop’s albums', () => {
    expect(
      shopAlbumEntries(
        [
          {
            collectionId: 'a1',
            name: 'Wedding',
            coverImage: null,
            companyId: 'ravi',
            companyName: 'Surat Silk House',
          },
          {
            collectionId: 'a2',
            name: 'Other',
            coverImage: null,
            companyId: 'meena',
            companyName: 'Jaipur Emporium',
          },
        ],
        'ravi',
      ),
    ).toHaveLength(1);
  });
});

describe('shopSelectedCount', () => {
  it('adds this shop’s designs and albums', () => {
    expect(
      shopSelectedCount(
        [surat, jaipur],
        [
          {
            collectionId: 'a1',
            name: 'Wedding',
            coverImage: null,
            companyId: 'ravi',
            companyName: 'Surat Silk House',
          },
        ],
        'ravi',
      ),
    ).toBe(2);
  });
});

describe('shopTabSelectedCount', () => {
  it('counts only the active tab so designs do not look like collections', () => {
    expect(shopTabSelectedCount('designs', 3, 2)).toBe(3);
    expect(shopTabSelectedCount('collections', 3, 2)).toBe(2);
    expect(shopTabSelectedCount('collections', 3, 0)).toBe(0);
  });
});

describe('shouldShowShopTradeDock', () => {
  it('shows for any shop with picks (own Message muted in UI)', () => {
    expect(shouldShowShopTradeDock({ isOwn: false, shopSelectedCount: 1 })).toBe(true);
    expect(shouldShowShopTradeDock({ isOwn: false, shopSelectedCount: 0 })).toBe(false);
    expect(shouldShowShopTradeDock({ isOwn: true, shopSelectedCount: 2 })).toBe(true);
    expect(shouldShowShopTradeDock({ isOwn: true, shopSelectedCount: 0 })).toBe(false);
  });
});

describe('companyIdFromPath', () => {
  it('reads the shop id', () => {
    expect(companyIdFromPath('/company/ravi')).toBe('ravi');
    expect(companyIdFromPath('/explore')).toBeNull();
  });
});
