/** In-memory Explore return: land on the opened pack after album Back. */

export type ExploreScrollRestore = {
  focusCollectionId: string | null;
  scrollTop: number;
  homeTailOpen: boolean;
};

const emptyRestore = (): ExploreScrollRestore => ({
  focusCollectionId: null,
  scrollTop: 0,
  homeTailOpen: false,
});

let restore: ExploreScrollRestore | null = null;

export function shellMainScrollEl(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector('main.ekum-shell-scroll');
}

/** Scroll a feed card into view inside the phone-column main (not window). */
export function scrollShellToElement(el: HTMLElement): void {
  const main = shellMainScrollEl();
  if (!main) {
    el.scrollIntoView({ block: 'start' });
    return;
  }
  const mainRect = main.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  main.scrollTop = Math.max(0, main.scrollTop + (elRect.top - mainRect.top));
}

export function peekExploreScrollRestore(): ExploreScrollRestore | null {
  return restore;
}

export function clearExploreScrollSession(): void {
  restore = null;
}

export function writeExploreHomeTailOpen(open: boolean): void {
  restore = { ...(restore ?? emptyRestore()), homeTailOpen: open };
}

export function writeExploreScrollTop(scrollTop: number): void {
  restore = { ...(restore ?? emptyRestore()), scrollTop };
}

/**
 * Record which pack the trader opened from Explore so Back can land on that card.
 * No-op when not on `/explore` (same card components can open albums elsewhere).
 */
export function noteExploreCollectionOpen(collectionId: string): void {
  if (typeof window !== 'undefined' && window.location.pathname !== '/explore') {
    return;
  }
  const main = shellMainScrollEl();
  restore = {
    focusCollectionId: collectionId,
    scrollTop: main?.scrollTop ?? restore?.scrollTop ?? 0,
    homeTailOpen: restore?.homeTailOpen ?? false,
  };
}

export function exploreCollectionOpenTestId(collectionId: string): string {
  return `explore-collection-open-${collectionId}`;
}

export function exploreCollectionPhotosTestId(collectionId: string): string {
  return `explore-collection-photos-${collectionId}`;
}

/** Find the pack card node to scroll to after remount (prefer whole article). */
export function findExploreCollectionAnchor(collectionId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const photos = document.querySelector(
    `[data-testid="${exploreCollectionPhotosTestId(collectionId)}"]`,
  );
  if (photos instanceof HTMLElement) {
    return (photos.closest('article') as HTMLElement | null) ?? photos;
  }
  const open = document.querySelector(
    `[data-testid="${exploreCollectionOpenTestId(collectionId)}"]`,
  );
  if (open instanceof HTMLElement) {
    return (open.closest('article') as HTMLElement | null) ?? open;
  }
  return null;
}

/**
 * Apply pending restore once. Returns true when consumed (anchor found, scrollTop
 * applied, or nothing pending). Returns false when still waiting for the card DOM.
 */
export function applyExploreScrollRestore(opts?: {
  /** When true, keep waiting for the focused card instead of falling back. */
  waitForFocus?: boolean;
}): boolean {
  const pending = restore;
  if (!pending) return true;
  if (!pending.focusCollectionId && pending.scrollTop <= 0 && !pending.homeTailOpen) {
    restore = null;
    return true;
  }

  if (pending.focusCollectionId) {
    const el = findExploreCollectionAnchor(pending.focusCollectionId);
    if (el) {
      scrollShellToElement(el);
      restore = null;
      return true;
    }
    if (opts?.waitForFocus) return false;
  }

  if (pending.scrollTop > 0) {
    const main = shellMainScrollEl();
    if (main) main.scrollTop = pending.scrollTop;
  }
  restore = null;
  return true;
}
