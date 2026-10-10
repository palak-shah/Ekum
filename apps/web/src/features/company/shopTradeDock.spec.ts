import { describe, expect, it } from 'vitest';
import {
  companyIdFromPath,
  shouldHideAppNav,
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
  it('shows only for another shop with picks', () => {
    expect(shouldShowShopTradeDock({ isOwn: false, shopSelectedCount: 1 })).toBe(true);
    expect(shouldShowShopTradeDock({ isOwn: false, shopSelectedCount: 0 })).toBe(false);
    expect(shouldShowShopTradeDock({ isOwn: true, shopSelectedCount: 2 })).toBe(false);
  });
});

describe('shouldHideAppNav', () => {
  it('hides when the Selection dock owns Explore', () => {
    expect(
      shouldHideAppNav('/explore', {
        thisShopSelectedCount: 0,
        selectionWorkspaceUp: true,
      }),
    ).toBe(true);
  });

  it('hides on Your selection', () => {
    expect(shouldHideAppNav('/selection', { thisShopSelectedCount: 0 })).toBe(true);
  });

  it('hides on a shared design set while the trade dock is up', () => {
    expect(shouldHideAppNav('/designs/set', { thisShopSelectedCount: 0, pageDockUp: true })).toBe(
      true,
    );
    expect(shouldHideAppNav('/designs/set', { thisShopSelectedCount: 0 })).toBe(false);
  });

  it('hides on a pack or design page while Ask / Order owns the band', () => {
    expect(
      shouldHideAppNav('/collections/pack-1', { thisShopSelectedCount: 0, pageDockUp: true }),
    ).toBe(true);
    expect(shouldHideAppNav('/collections/pack-1', { thisShopSelectedCount: 0 })).toBe(false);
    expect(
      shouldHideAppNav('/explore/products/d1', { thisShopSelectedCount: 0, pageDockUp: true }),
    ).toBe(true);
  });

  it('hides on You while the library select dock is up', () => {
    expect(shouldHideAppNav('/more', { thisShopSelectedCount: 0, pageDockUp: true })).toBe(true);
    expect(shouldHideAppNav('/more', { thisShopSelectedCount: 0 })).toBe(false);
  });

  it('hides on another shop profile even with nothing selected', () => {
    expect(
      shouldHideAppNav('/company/ravi', { myCompanyId: 'meena', thisShopSelectedCount: 0 }),
    ).toBe(true);
    expect(
      shouldHideAppNav('/company/ravi', { myCompanyId: 'meena', thisShopSelectedCount: 1 }),
    ).toBe(true);
  });

  it('keeps nav on own shop', () => {
    expect(
      shouldHideAppNav('/company/meena', { myCompanyId: 'meena', thisShopSelectedCount: 2 }),
    ).toBe(false);
  });
  it('hides on New collection and edit collection', () => {
    expect(shouldHideAppNav('/catalog/collections/new', { thisShopSelectedCount: 0 })).toBe(true);
    expect(
      shouldHideAppNav('/catalog/collections/abc', { thisShopSelectedCount: 0 }),
    ).toBe(true);
  });

  it('hides on own profile only while editing', () => {
    expect(shouldHideAppNav('/settings/profile', { thisShopSelectedCount: 0 })).toBe(false);
    expect(
      shouldHideAppNav('/settings/profile', { thisShopSelectedCount: 0, search: '?edit=1' }),
    ).toBe(true);
    expect(
      shouldHideAppNav('/settings/profile', { thisShopSelectedCount: 0, search: '?focus=sell' }),
    ).toBe(true);
  });
});

describe('companyIdFromPath', () => {
  it('reads the shop id', () => {
    expect(companyIdFromPath('/company/ravi')).toBe('ravi');
    expect(companyIdFromPath('/explore')).toBeNull();
  });
});
