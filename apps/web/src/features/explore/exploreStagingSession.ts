import { clearSelection } from '@/features/browse/clearSelection';

/** Pathname only — `?story=` / `?show=` on `/explore` is not leave. */
export function explorePathLeft(from: string, to: string): boolean {
  return from === '/explore' && to !== '/explore';
}

/** Drop Explore staging checks + Selecting. Does not touch the parked cart. */
export function clearExploreStaging(): void {
  clearSelection();
}

export function noteExplorePathChange(from: string, to: string): void {
  if (explorePathLeft(from, to)) clearExploreStaging();
}

/** Last uncheck of the mixed Explore pile must unarm both stores (Select arms both). */
export function exitExploreSelectIfEmpty(
  combinedCount: number,
  shortlist: { setSelectMode: (on: boolean) => void },
  albumPick: { setSelectMode: (on: boolean) => void },
): void {
  if (combinedCount > 0) return;
  shortlist.setSelectMode(false);
  albumPick.setSelectMode(false);
}
