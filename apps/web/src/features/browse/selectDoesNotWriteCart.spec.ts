import { beforeEach, describe, expect, it } from 'vitest';
import { clearBrowseAlbumPick, toggleBrowseAlbumEntry } from './browseAlbumPick';
import {
  clearBrowseCart,
  readCartAlbums,
  readCartDesigns,
} from './browseCart';
import { clearBrowseShortlist, toggleBrowseShortlistEntry } from './browseShortlist';

describe('select does not write cart', () => {
  beforeEach(() => {
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    clearBrowseCart();
  });

  it('toggling a design stages only', () => {
    toggleBrowseShortlistEntry({
      productId: 'p1',
      name: 'Silk',
      thumbUrl: null,
      companyId: 'c1',
      companyName: 'Mill',
    });
    expect(readCartDesigns()).toEqual([]);
    expect(readCartAlbums()).toEqual([]);
  });

  it('toggling a collection stages only', () => {
    toggleBrowseAlbumEntry({
      collectionId: 'a1',
      name: 'Wedding',
      coverImage: null,
      companyId: 'c1',
      companyName: 'Mill',
    });
    expect(readCartDesigns()).toEqual([]);
    expect(readCartAlbums()).toEqual([]);
  });
});
