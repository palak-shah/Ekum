import { clearBrowseAlbumPick, readBrowseAlbumPick } from './browseAlbumPick';
import { addCartAlbumsMany, addCartDesignsMany } from './browseCart';
import { clearBrowseShortlist, readBrowseShortlist } from './browseShortlist';
import { clearResumeAfterAlbumPick } from './resumeAfterAlbumPick';
import { tradeableShortlistEntries } from './selectionEligibility';

/**
 * Move Explore staging (shortlist + album pick) into the cart, then clear selection.
 * Unpublished designs are skipped. Returns how many lines were added (after merge
 * dedupe, counts staging size) and how many designs were skipped.
 */
export function addStagingToCart(): { added: number; skipped: number } {
  const staged = readBrowseShortlist();
  const designs = tradeableShortlistEntries(staged);
  const skipped = staged.length - designs.length;
  const albums = readBrowseAlbumPick();
  const added = designs.length + albums.length;
  if (added === 0) {
    if (skipped > 0) {
      clearBrowseShortlist();
      clearBrowseAlbumPick();
      clearResumeAfterAlbumPick();
    }
    return { added: 0, skipped };
  }
  addCartDesignsMany(designs);
  addCartAlbumsMany(albums);
  clearBrowseShortlist();
  clearBrowseAlbumPick();
  clearResumeAfterAlbumPick();
  return { added, skipped };
}
