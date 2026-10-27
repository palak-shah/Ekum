import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearBrowseShortlist } from './browseShortlist';
import { resetBrowseShortlistSelectMode, useBrowseShortlist } from './useBrowseShortlist';
import { clearBrowseAlbumPick } from './browseAlbumPick';
import { resetBrowseAlbumPickSelectMode, useBrowseAlbumPick } from './useBrowseAlbumPick';
import { exitExploreSelectIfEmpty } from '@/features/explore/exploreStagingSession';

const design = {
  productId: 'p1',
  name: 'Grey',
  thumbUrl: null,
  companyId: 'c1',
  companyName: 'Ahmedabad Loom Co',
};

const album = {
  collectionId: 'col1',
  name: 'Monsoon',
  coverImage: null,
  companyId: 'c1',
  companyName: 'Ahmedabad Loom Co',
  productCount: 12,
};

afterEach(() => cleanup());

describe('useBrowseShortlist selectMode', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseShortlist();
    resetBrowseShortlistSelectMode();
  });

  it('exits select mode when the last design is toggled off', () => {
    const { result } = renderHook(() => useBrowseShortlist());
    act(() => {
      result.current.toggle(design);
    });
    expect(result.current.selectMode).toBe(true);
    act(() => {
      result.current.toggle(design);
    });
    expect(result.current.count).toBe(0);
    expect(result.current.selectMode).toBe(false);
  });

  it('exits select mode when the shared shortlist is cleared elsewhere', () => {
    const { result } = renderHook(() => useBrowseShortlist());
    act(() => {
      result.current.toggle(design);
    });
    expect(result.current.selectMode).toBe(true);
    act(() => {
      clearBrowseShortlist();
    });
    expect(result.current.count).toBe(0);
    expect(result.current.selectMode).toBe(false);
  });

  it('stays in select mode when entering with an empty shortlist', () => {
    const { result } = renderHook(() => useBrowseShortlist());
    act(() => {
      result.current.setSelectMode(true);
    });
    expect(result.current.count).toBe(0);
    expect(result.current.selectMode).toBe(true);
  });

  it('shares empty select mode across hook instances', () => {
    const a = renderHook(() => useBrowseShortlist());
    const b = renderHook(() => useBrowseShortlist());
    act(() => {
      a.result.current.setSelectMode(true);
    });
    expect(b.result.current.selectMode).toBe(true);
  });
});

describe('useBrowseAlbumPick selectMode', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseAlbumPick();
    resetBrowseAlbumPickSelectMode();
  });

  it('exits select mode when the last album is toggled off', () => {
    const { result } = renderHook(() => useBrowseAlbumPick());
    act(() => {
      result.current.toggle(album);
    });
    expect(result.current.selectMode).toBe(true);
    act(() => {
      result.current.toggle(album);
    });
    expect(result.current.count).toBe(0);
    expect(result.current.selectMode).toBe(false);
  });
});

describe('Explore mixed select arms', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    resetBrowseShortlistSelectMode();
    resetBrowseAlbumPickSelectMode();
  });

  it('unarms album select when the last design is unchecked', () => {
    const shortlist = renderHook(() => useBrowseShortlist());
    const albumPick = renderHook(() => useBrowseAlbumPick());
    act(() => {
      shortlist.result.current.setSelectMode(true);
      albumPick.result.current.setSelectMode(true);
      shortlist.result.current.toggle(design);
    });
    expect(albumPick.result.current.selectMode).toBe(true);
    act(() => {
      const next = shortlist.result.current.toggle(design);
      exitExploreSelectIfEmpty(
        next.length + albumPick.result.current.count,
        shortlist.result.current,
        albumPick.result.current,
      );
    });
    expect(shortlist.result.current.count).toBe(0);
    expect(shortlist.result.current.selectMode).toBe(false);
    expect(albumPick.result.current.selectMode).toBe(false);
  });

  it('stays Selecting when a pack is still checked', () => {
    const shortlist = renderHook(() => useBrowseShortlist());
    const albumPick = renderHook(() => useBrowseAlbumPick());
    act(() => {
      shortlist.result.current.setSelectMode(true);
      albumPick.result.current.setSelectMode(true);
      albumPick.result.current.toggle(album);
      shortlist.result.current.toggle(design);
    });
    act(() => {
      const next = shortlist.result.current.toggle(design);
      exitExploreSelectIfEmpty(
        next.length + albumPick.result.current.count,
        shortlist.result.current,
        albumPick.result.current,
      );
    });
    expect(shortlist.result.current.count).toBe(0);
    expect(albumPick.result.current.count).toBe(1);
    expect(albumPick.result.current.selectMode).toBe(true);
  });

  it('stays Selecting at 0 items after tapping Select', () => {
    const shortlist = renderHook(() => useBrowseShortlist());
    const albumPick = renderHook(() => useBrowseAlbumPick());
    act(() => {
      shortlist.result.current.setSelectMode(true);
      albumPick.result.current.setSelectMode(true);
    });
    expect(shortlist.result.current.count).toBe(0);
    expect(shortlist.result.current.selectMode).toBe(true);
    expect(albumPick.result.current.selectMode).toBe(true);
  });
});
