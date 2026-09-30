import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { createArmedSelectFlag } from './armedSelectFlag';
import {
  addBrowseAlbumPickMany,
  clearBrowseAlbumPick,
  readBrowseAlbumPick,
  removeBrowseAlbumIds,
  subscribeBrowseAlbumPick,
  toggleBrowseAlbumEntry,
  type BrowseAlbumEntry,
} from './browseAlbumPick';

const selectArm = createArmedSelectFlag();

export function resetBrowseAlbumPickSelectMode() {
  selectArm.set(false);
}

export function useBrowseAlbumPick() {
  const entries = useSyncExternalStore(
    subscribeBrowseAlbumPick,
    readBrowseAlbumPick,
    () => [] as BrowseAlbumEntry[],
  );
  const armed = useSyncExternalStore(selectArm.subscribe, selectArm.get, () => false);
  const selectMode = entries.length > 0 || armed;

  useEffect(() => {
    if (entries.length > 0) selectArm.set(true);
  }, [entries.length]);

  const collectionIds = useMemo(
    () => new Set(entries.map((entry) => entry.collectionId)),
    [entries],
  );

  const setSelectMode = useCallback((on: boolean) => {
    selectArm.set(on);
  }, []);

  const addMany = useCallback((incoming: BrowseAlbumEntry[]) => {
    const next = addBrowseAlbumPickMany(incoming);
    selectArm.set(next.length > 0);
    return next;
  }, []);

  const toggle = useCallback((entry: BrowseAlbumEntry) => {
    const next = toggleBrowseAlbumEntry(entry);
    // Empty pick must leave select mode (Explore: otherwise taps stay select, not open).
    selectArm.set(next.length > 0);
    return next;
  }, []);

  const removeIds = useCallback((ids: string[]) => {
    const next = removeBrowseAlbumIds(ids);
    selectArm.set(next.length > 0);
    return next;
  }, []);

  const clear = useCallback(() => {
    clearBrowseAlbumPick();
    selectArm.set(false);
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
