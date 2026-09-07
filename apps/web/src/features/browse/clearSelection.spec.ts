import { beforeEach, describe, expect, it } from 'vitest';
import { clearBrowseAlbumPick, readBrowseAlbumPick, toggleBrowseAlbumEntry } from './browseAlbumPick';
import { clearBrowseShortlist, readBrowseShortlist, toggleBrowseShortlistEntry } from './browseShortlist';
import { clearSelection } from './clearSelection';

describe('clearSelection', () => {
  beforeEach(() => {
    clearBrowseShortlist();
    clearBrowseAlbumPick();
  });

  it('empties both design and collection stores', () => {
    toggleBrowseShortlistEntry({
      productId: 'p1',
      name: 'Design',
      thumbUrl: null,
      companyId: 'c1',
      companyName: 'Co',
    });
    toggleBrowseAlbumEntry({
      collectionId: 'a1',
      name: 'Album',
      coverImage: null,
      companyId: 'c1',
      companyName: 'Co',
    });
    expect(readBrowseShortlist()).toHaveLength(1);
    expect(readBrowseAlbumPick()).toHaveLength(1);
    clearSelection();
    expect(readBrowseShortlist()).toHaveLength(0);
    expect(readBrowseAlbumPick()).toHaveLength(0);
  });
});
