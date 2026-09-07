import { clearBrowseAlbumPick } from './browseAlbumPick';
import { clearBrowseShortlist } from './browseShortlist';
import { clearResumeAfterAlbumPick } from './resumeAfterAlbumPick';

/** Empty the traveling Selection (designs + collections). */
export function clearSelection(): void {
  clearBrowseShortlist();
  clearBrowseAlbumPick();
  clearResumeAfterAlbumPick();
}
