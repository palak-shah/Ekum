import { clearBrowseAlbumPick } from './browseAlbumPick';
import { clearBrowseShortlist } from './browseShortlist';
import { clearResumeAfterAlbumPick } from './resumeAfterAlbumPick';
import { resetBrowseAlbumPickSelectMode } from './useBrowseAlbumPick';
import { resetBrowseShortlistSelectMode } from './useBrowseShortlist';

/** Empty the traveling Selection (designs + collections) and leave Selecting. */
export function clearSelection(): void {
  clearBrowseShortlist();
  clearBrowseAlbumPick();
  clearResumeAfterAlbumPick();
  resetBrowseShortlistSelectMode();
  resetBrowseAlbumPickSelectMode();
}
