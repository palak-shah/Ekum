import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  addBrowseAlbumPickMany,
  clearBrowseAlbumPick,
  readBrowseAlbumPick,
  removeBrowseAlbumIds,
  subscribeBrowseAlbumPick,
  toggleBrowseAlbumEntry,
  type BrowseAlbumEntry,
} from './browseAlbumPick';

export function useBrowseAlbumPick() {
  const entries = useSyncExternalStore(
    subscribeBrowseAlbumPick,
    readBrowseAlbumPick,
    () => [] as BrowseAlbumEntry[],
  );
  const [selectMode, setSelectMode] = useState(() => readBrowseAlbumPick().length > 0);

  useEffect(() => {
    if (entries.length > 0) setSelectMode(true);
  }, [entries.length]);

  const collectionIds = useMemo(
    () => new Set(entries.map((entry) => entry.collectionId)),
    [entries],
  );

  const addMany = useCallback((incoming: BrowseAlbumEntry[]) => {
    const next = addBrowseAlbumPickMany(incoming);
    setSelectMode(next.length > 0);
    return next;
  }, []);

  const toggle = useCallback((entry: BrowseAlbumEntry) => {
    const next = toggleBrowseAlbumEntry(entry);
    // Empty pick must leave select mode (Explore: otherwise taps stay select, not open).
    setSelectMode(next.length > 0);
    return next;
  }, []);

  const removeIds = useCallback((ids: string[]) => {
    const next = removeBrowseAlbumIds(ids);
    setSelectMode(next.length > 0);
    return next;
  }, []);

  const clear = useCallback(() => {
    clearBrowseAlbumPick();
    setSelectMode(false);
  }, []);

  return {
    entries,
    collectionIds,
    count: entries.length,
    toggle,
    addMany,
    removeIds,
    clear,
    selectMode,
    setSelectMode,
  };
}
