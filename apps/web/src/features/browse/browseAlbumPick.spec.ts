import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearBrowseAlbumPick,
  readBrowseAlbumPick,
  toggleBrowseAlbumEntry,
  writeBrowseAlbumPick,
} from './browseAlbumPick';
import {
  clearBrowseShortlist,
  readBrowseShortlist,
  toggleBrowseShortlistEntry,
} from './browseShortlist';

const album = {
  collectionId: 'col1',
  name: 'Monsoon',
  coverImage: null,
  companyId: 'c1',
  companyName: 'Ahmedabad Loom Co',
  productCount: 12,
};

const design = {
  productId: 'p1',
  name: 'Grey',
  thumbUrl: null,
  companyId: 'c1',
  companyName: 'Ahmedabad Loom Co',
};

describe('browseAlbumPick', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseAlbumPick();
    clearBrowseShortlist();
  });

  it('persists album toggles across read', () => {
    toggleBrowseAlbumEntry(album);
    expect(readBrowseAlbumPick()).toEqual([album]);
    toggleBrowseAlbumEntry(album);
    expect(readBrowseAlbumPick()).toEqual([]);
  });

  it('keeps albums and designs independently (no silent clear)', () => {
    toggleBrowseAlbumEntry(album);
    toggleBrowseShortlistEntry(design);
    expect(readBrowseAlbumPick().map((e) => e.collectionId)).toEqual(['col1']);
    expect(readBrowseShortlist().map((e) => e.productId)).toEqual(['p1']);
    writeBrowseAlbumPick([album, { ...album, collectionId: 'col2', name: 'Winter' }]);
    expect(readBrowseAlbumPick()).toHaveLength(2);
    expect(readBrowseShortlist()).toHaveLength(1);
  });
});
