import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { createArmedSelectFlag } from './armedSelectFlag';
import {
  addBrowseShortlistMany,
  clearBrowseShortlist,
  readBrowseShortlist,
  removeBrowseShortlistIds,
  subscribeBrowseShortlist,
  toggleBrowseShortlistEntry,
  type BrowseShortlistEntry,
} from './browseShortlist';

const selectArm = createArmedSelectFlag();

export function resetBrowseShortlistSelectMode() {
  selectArm.set(false);
}

export function useBrowseShortlist() {
  const entries = useSyncExternalStore(
    subscribeBrowseShortlist,
    readBrowseShortlist,
    () => [] as BrowseShortlistEntry[],
  );
  const armed = useSyncExternalStore(selectArm.subscribe, selectArm.get, () => false);
  const selectMode = entries.length > 0 || armed;
  const prevCountRef = useRef(entries.length);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = entries.length;
    if (entries.length > 0) {
      selectArm.set(true);
    } else if (prev > 0) {
      // Another surface (e.g. order flow hook) cleared the shared shortlist.
      selectArm.set(false);
    }
  }, [entries.length]);

  const productIds = useMemo(
    () => new Set(entries.map((entry) => entry.productId)),
    [entries],
  );

  const setSelectMode = useCallback((on: boolean) => {
    selectArm.set(on);
  }, []);

  const toggle = useCallback((entry: BrowseShortlistEntry) => {
    const next = toggleBrowseShortlistEntry(entry);
    // Empty pick must leave select mode (Explore: otherwise taps stay select, not open).
    selectArm.set(next.length > 0);
    return next;
  }, []);

  const addMany = useCallback((incoming: BrowseShortlistEntry[]) => {
    const next = addBrowseShortlistMany(incoming);
    selectArm.set(next.length > 0);
    return next;
  }, []);

  const removeIds = useCallback((productIdsToRemove: string[]) => {
    const next = removeBrowseShortlistIds(productIdsToRemove);
    selectArm.set(next.length > 0);
    return next;
  }, []);

  const clear = useCallback(() => {
    clearBrowseShortlist();
    selectArm.set(false);
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
