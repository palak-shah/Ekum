import { describe, expect, it } from 'vitest';
import {
  mergeShortlistWithProducts,
  orderResolveSummary,
  pickSelectionLabel,
  shouldShowAlbumSelectActions,
  type OrderAlbumChoice,
} from './albumSelectModel';
import type { BrowseShortlistEntry } from './browseShortlist';

describe('pickSelectionLabel', () => {
  it('names designs and collections together', () => {
    expect(pickSelectionLabel(1, 4)).toBe('4 designs · 1 collection');
    expect(pickSelectionLabel(2, 1)).toBe('1 design · 2 collections');
  });

  it('handles one type only', () => {
    expect(pickSelectionLabel(1, 0)).toBe('1 collection selected');
    expect(pickSelectionLabel(0, 3)).toBe('3 selected');
  });
});

describe('shouldShowAlbumSelectActions', () => {
  it('keeps all four actions for designs, collections, or mixed', () => {
    expect(shouldShowAlbumSelectActions({ designCount: 2, albumCount: 0, trading: true })).toEqual({
      order: true,
      curate: true,
      bookmark: true,
      share: true,
    });
    expect(shouldShowAlbumSelectActions({ designCount: 0, albumCount: 1, trading: true })).toEqual({
      order: true,
      curate: true,
      bookmark: true,
      share: true,
    });
    expect(shouldShowAlbumSelectActions({ designCount: 2, albumCount: 1, trading: true })).toEqual({
      order: true,
      curate: true,
      bookmark: true,
      share: true,
    });
  });

  it('hides Curate when Trading is off', () => {
    expect(shouldShowAlbumSelectActions({ designCount: 1, albumCount: 1, trading: false }).curate).toBe(
      false,
    );
  });
});

describe('orderResolveSummary', () => {
  it('describes mixed picks before resolve', () => {
    expect(orderResolveSummary(4, 1)).toBe('You selected 4 designs + 1 collection.');
    expect(orderResolveSummary(0, 2)).toBe('You selected 2 collections.');
  });
});

describe('mergeShortlistWithProducts', () => {
  it('dedupes a design already in the shortlist', () => {
    const existing: BrowseShortlistEntry[] = [
      {
        productId: 'p1',
        name: 'Keep',
        thumbUrl: null,
        companyId: 'c1',
        companyName: 'Shop',
      },
    ];
    const fromAlbum: BrowseShortlistEntry[] = [
      {
        productId: 'p1',
        name: 'From album',
        thumbUrl: 'https://x/a.jpg',
        companyId: 'c1',
        companyName: 'Shop',
      },
      {
        productId: 'p2',
        name: 'New',
        thumbUrl: null,
        companyId: 'c2',
        companyName: 'Mill',
      },
    ];
    const merged = mergeShortlistWithProducts(existing, fromAlbum);
    expect(merged.map((e) => e.productId)).toEqual(['p1', 'p2']);
    expect(merged[0]?.name).toBe('Keep');
  });
});

describe('OrderAlbumChoice', () => {
  it('only allows all or choose', () => {
    const choice: OrderAlbumChoice = 'all';
    expect(choice === 'all' || choice === 'choose').toBe(true);
  });
});
