import { clearExploreOriginAlbumPick } from '@/features/browse/browseAlbumPick';
import { clearExploreOriginShortlist } from '@/features/browse/browseShortlist';
import { clearResumeAfterAlbumPick } from '@/features/browse/resumeAfterAlbumPick';
import { resetBrowseAlbumPickSelectMode } from '@/features/browse/useBrowseAlbumPick';
import { resetBrowseShortlistSelectMode } from '@/features/browse/useBrowseShortlist';

/** Pathname only — `?story=` / `?show=` on `/explore` is not leave. */
export function explorePathLeft(from: string, to: string): boolean {
  return from === '/explore' && to !== '/explore';
}

/**
 * Drop Explore-origin staging checks. Traveling Selection (album → Explore) stays.
 * Does not touch the parked cart. Exits Selecting only when both piles are empty.
 */
export function clearExploreStaging(): void {
  const designs = clearExploreOriginShortlist();
  const albums = clearExploreOriginAlbumPick();
  clearResumeAfterAlbumPick();
  if (designs.length === 0 && albums.length === 0) {
    resetBrowseShortlistSelectMode();
    resetBrowseAlbumPickSelectMode();
  }
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
