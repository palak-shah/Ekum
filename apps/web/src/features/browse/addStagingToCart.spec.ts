import { beforeEach, describe, expect, it } from 'vitest';
import { addStagingToCart } from './addStagingToCart';
import { clearBrowseAlbumPick, readBrowseAlbumPick, writeBrowseAlbumPick } from './browseAlbumPick';
import { clearBrowseCart, readCartAlbums, readCartDesigns } from './browseCart';
import { clearBrowseShortlist, readBrowseShortlist, writeBrowseShortlist } from './browseShortlist';

describe('addStagingToCart', () => {
  beforeEach(() => {
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    clearBrowseCart();
  });

  it('merges staging into cart and clears selection', () => {
    writeBrowseShortlist([
      {
        productId: 'p1',
        name: 'Silk',
        thumbUrl: null,
        companyId: 'c1',
        companyName: 'Mill',
      },
    ]);
    writeBrowseAlbumPick([
      {
        collectionId: 'a1',
        name: 'Wedding',
        coverImage: null,
        companyId: 'c1',
        companyName: 'Mill',
      },
    ]);
    expect(addStagingToCart()).toEqual({ added: 2 });
    expect(readBrowseShortlist()).toEqual([]);
    expect(readBrowseAlbumPick()).toEqual([]);
    expect(readCartDesigns()).toHaveLength(1);
    expect(readCartAlbums()).toHaveLength(1);
  });

  it('dedupes designs already in the cart', () => {
    writeBrowseShortlist([
      {
        productId: 'p1',
        name: 'Silk',
        thumbUrl: null,
        companyId: 'c1',
        companyName: 'Mill',
      },
    ]);
    addStagingToCart();
    writeBrowseShortlist([
      {
        productId: 'p1',
        name: 'Silk v2',
        thumbUrl: null,
        companyId: 'c1',
        companyName: 'Mill',
      },
    ]);
    addStagingToCart();
    expect(readCartDesigns()).toHaveLength(1);
    expect(readCartDesigns()[0]?.name).toBe('Silk v2');
  });
});
