import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearBrowseShortlist } from './browseShortlist';
import { useBrowseShortlist } from './useBrowseShortlist';
import { clearBrowseAlbumPick } from './browseAlbumPick';
import { useBrowseAlbumPick } from './useBrowseAlbumPick';

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
});

describe('useBrowseAlbumPick selectMode', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseAlbumPick();
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
