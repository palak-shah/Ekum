import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  clearBrowseAlbumPick,
  readBrowseAlbumPick,
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

  const toggle = useCallback((entry: BrowseAlbumEntry) => {
    const next = toggleBrowseAlbumEntry(entry);
    if (next.length > 0) setSelectMode(true);
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
    clear,
    selectMode,
    setSelectMode,
  };
}
