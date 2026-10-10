import { clearBrowseAlbumPick, readBrowseAlbumPick } from './browseAlbumPick';
import { addCartAlbumsMany, addCartDesignsMany } from './browseCart';
import { clearBrowseShortlist, readBrowseShortlist } from './browseShortlist';
import { clearResumeAfterAlbumPick } from './resumeAfterAlbumPick';

/**
 * Move Explore staging (shortlist + album pick) into the cart, then clear selection.
 * Returns how many lines were added (after merge dedupe, counts staging size).
 */
export function addStagingToCart(): { added: number } {
  const designs = readBrowseShortlist();
  const albums = readBrowseAlbumPick();
  const added = designs.length + albums.length;
  if (added === 0) return { added: 0 };
  addCartDesignsMany(designs);
  addCartAlbumsMany(albums);
  clearBrowseShortlist();
  clearBrowseAlbumPick();
  clearResumeAfterAlbumPick();
  return { added };
}
