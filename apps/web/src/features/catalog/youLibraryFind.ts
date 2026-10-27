/** Page ⋯ Drafts / Deleted / Bookmarks keep Find open so Showing + Clear is on screen. */
export function youLibraryFindStaysOpen(input: {
  saved?: boolean;
  view?: string | null;
}): boolean {
  if (input.saved) return true;
  return input.view === 'draft' || input.view === 'archived';
}

/** Label inside “Showing …” for page ⋯ status views. Find Draft on Designs is “Draft”. */
export function youLibraryPageViewSummary(input: {
  saved?: boolean;
  view?: string | null;
}): string | null {
  if (input.saved) return 'Bookmark';
  if (input.view === 'archived') return 'Deleted';
  if (input.view === 'draft') return 'Drafts';
  return null;
}
