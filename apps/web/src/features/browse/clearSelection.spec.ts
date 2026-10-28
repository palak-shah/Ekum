import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearBrowseAlbumPick, readBrowseAlbumPick, toggleBrowseAlbumEntry } from './browseAlbumPick';
import { clearBrowseShortlist, readBrowseShortlist, toggleBrowseShortlistEntry } from './browseShortlist';
import { clearSelection } from './clearSelection';
import { resetBrowseAlbumPickSelectMode, useBrowseAlbumPick } from './useBrowseAlbumPick';
import { resetBrowseShortlistSelectMode, useBrowseShortlist } from './useBrowseShortlist';

afterEach(() => cleanup());

describe('clearSelection', () => {
  beforeEach(() => {
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    resetBrowseShortlistSelectMode();
    resetBrowseAlbumPickSelectMode();
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

  it('unarms both select modes so Selecting ends', () => {
    const shortlist = renderHook(() => useBrowseShortlist());
    const albumPick = renderHook(() => useBrowseAlbumPick());
    act(() => {
      shortlist.result.current.setSelectMode(true);
      albumPick.result.current.setSelectMode(true);
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
    });
    expect(shortlist.result.current.selectMode).toBe(true);
    expect(albumPick.result.current.selectMode).toBe(true);
    act(() => {
      clearSelection();
    });
    expect(readBrowseShortlist()).toHaveLength(0);
    expect(readBrowseAlbumPick()).toHaveLength(0);
    expect(shortlist.result.current.selectMode).toBe(false);
    expect(albumPick.result.current.selectMode).toBe(false);
  });
});
