import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearBrowseAlbumPick, readBrowseAlbumPick, toggleBrowseAlbumEntry } from '@/features/browse/browseAlbumPick';
import { clearBrowseShortlist, readBrowseShortlist, toggleBrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { clearBrowseCart, readCartDesigns, writeCartDesigns } from '@/features/browse/browseCart';
import { resetBrowseAlbumPickSelectMode, useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { resetBrowseShortlistSelectMode, useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  clearExploreStaging,
  exitExploreSelectIfEmpty,
  explorePathLeft,
  noteExplorePathChange,
} from './exploreStagingSession';

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

describe('explorePathLeft', () => {
  it('clears when leaving Explore for another page', () => {
    expect(explorePathLeft('/explore', '/chats')).toBe(true);
    expect(explorePathLeft('/explore', '/')).toBe(true);
    expect(explorePathLeft('/explore', '/explore/products/x')).toBe(true);
    expect(explorePathLeft('/explore', '/collections/x')).toBe(true);
    expect(explorePathLeft('/explore', '/selection')).toBe(true);
  });

  it('keeps staging on the Explore feed (query is pathname-only)', () => {
    expect(explorePathLeft('/explore', '/explore')).toBe(false);
    expect(explorePathLeft('/chats', '/explore')).toBe(false);
    expect(explorePathLeft('/chats', '/orders')).toBe(false);
  });
});

describe('clearExploreStaging', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    clearBrowseCart();
    resetBrowseShortlistSelectMode();
    resetBrowseAlbumPickSelectMode();
  });

  it('empties staging and exits select mode without touching cart', () => {
    const shortlist = renderHook(() => useBrowseShortlist());
    const albumPick = renderHook(() => useBrowseAlbumPick());
    act(() => {
      shortlist.result.current.toggle(design);
      albumPick.result.current.setSelectMode(true);
      writeCartDesigns([design]);
    });
    expect(readBrowseShortlist()).toHaveLength(1);
    expect(albumPick.result.current.selectMode).toBe(true);
    expect(readCartDesigns()).toHaveLength(1);

    act(() => {
      clearExploreStaging();
    });
    expect(readBrowseShortlist()).toHaveLength(0);
    expect(readBrowseAlbumPick()).toHaveLength(0);
    expect(shortlist.result.current.selectMode).toBe(false);
    expect(albumPick.result.current.selectMode).toBe(false);
    expect(readCartDesigns()).toHaveLength(1);
  });
});

describe('noteExplorePathChange', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    resetBrowseShortlistSelectMode();
    resetBrowseAlbumPickSelectMode();
  });

  it('clears staging when the pathname leaves /explore', () => {
    toggleBrowseShortlistEntry(design);
    toggleBrowseAlbumEntry(album);
    noteExplorePathChange('/explore', '/chats');
    expect(readBrowseShortlist()).toHaveLength(0);
    expect(readBrowseAlbumPick()).toHaveLength(0);
  });

  it('keeps staging when the Explore pathname does not change', () => {
    toggleBrowseShortlistEntry(design);
    noteExplorePathChange('/explore', '/explore');
    expect(readBrowseShortlist()).toHaveLength(1);
  });
});

describe('exitExploreSelectIfEmpty', () => {
  it('unarms both stores when the mixed pile is empty', () => {
    const shortlist = { setSelectMode: vi.fn() };
    const albumPick = { setSelectMode: vi.fn() };
    exitExploreSelectIfEmpty(0, shortlist, albumPick);
    expect(shortlist.setSelectMode).toHaveBeenCalledWith(false);
    expect(albumPick.setSelectMode).toHaveBeenCalledWith(false);
  });

  it('stays Selecting when a pack is still checked', () => {
    const shortlist = { setSelectMode: vi.fn() };
    const albumPick = { setSelectMode: vi.fn() };
    exitExploreSelectIfEmpty(1, shortlist, albumPick);
    expect(shortlist.setSelectMode).not.toHaveBeenCalled();
    expect(albumPick.setSelectMode).not.toHaveBeenCalled();
  });
});
