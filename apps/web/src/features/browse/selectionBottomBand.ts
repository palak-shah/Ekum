import { useEffect } from 'react';

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
  useEffect(() => {
    setPageOwnsBottomBand(owns);
    return () => setPageOwnsBottomBand(false);
  }, [owns]);
}
