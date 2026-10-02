import { useLayoutEffect } from 'react';

let pageOwnsBand = false;
const listeners = new Set<() => void>();

export function getPageOwnsBottomBand(): boolean {
  return pageOwnsBand;
}

export function subscribePageOwnsBottomBand(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function setPageOwnsBottomBand(next: boolean): void {
  if (pageOwnsBand === next) return;
  pageOwnsBand = next;
  for (const notify of listeners) notify();
}

/** While this screen pins a dock above nav, hide the Selection floater. */
export function usePageOwnsBottomBand(owns: boolean): void {
  useLayoutEffect(() => {
    setPageOwnsBottomBand(owns);
    return () => setPageOwnsBottomBand(false);
  }, [owns]);
}

let pageSelecting = false;
const selectingListeners = new Set<() => void>();

export function getPageSelecting(): boolean {
  return pageSelecting;
}

export function subscribePageSelecting(onStoreChange: () => void): () => void {
  selectingListeners.add(onStoreChange);
  return () => selectingListeners.delete(onStoreChange);
}

export function setPageSelecting(next: boolean): void {
  if (pageSelecting === next) return;
  pageSelecting = next;
  for (const notify of selectingListeners) notify();
}

/** Design / pack: floater only while this page is Selecting. */
export function usePageSelecting(selecting: boolean): void {
  useLayoutEffect(() => {
    setPageSelecting(selecting);
    return () => setPageSelecting(false);
  }, [selecting]);
}
