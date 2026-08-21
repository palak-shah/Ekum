import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  addBrowseShortlistMany,
  clearBrowseShortlist,
  readBrowseShortlist,
  removeBrowseShortlistIds,
  subscribeBrowseShortlist,
  toggleBrowseShortlistEntry,
  type BrowseShortlistEntry,
} from './browseShortlist';

export function useBrowseShortlist() {
  const entries = useSyncExternalStore(
    subscribeBrowseShortlist,
    readBrowseShortlist,
    () => [] as BrowseShortlistEntry[],
  );
  const [selectMode, setSelectMode] = useState(() => readBrowseShortlist().length > 0);

  useEffect(() => {
    if (entries.length > 0) setSelectMode(true);
  }, [entries.length]);

  const productIds = useMemo(
    () => new Set(entries.map((entry) => entry.productId)),
    [entries],
  );

  const toggle = useCallback((entry: BrowseShortlistEntry) => {
    const next = toggleBrowseShortlistEntry(entry);
    // Empty pick must leave select mode (Explore: otherwise taps stay select, not open).
    setSelectMode(next.length > 0);
    return next;
  }, []);

  const addMany = useCallback((incoming: BrowseShortlistEntry[]) => {
    const next = addBrowseShortlistMany(incoming);
    setSelectMode(next.length > 0);
    return next;
  }, []);

  const removeIds = useCallback((productIdsToRemove: string[]) => {
    const next = removeBrowseShortlistIds(productIdsToRemove);
    setSelectMode(next.length > 0);
    return next;
  }, []);

  const clear = useCallback(() => {
    clearBrowseShortlist();
    setSelectMode(false);
  }, []);

  return {
    entries,
    productIds,
    count: entries.length,
    toggle,
    addMany,
    removeIds,
    clear,
    selectMode,
    setSelectMode,
  };
}
