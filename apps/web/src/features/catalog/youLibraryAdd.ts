/** New design list row — Designs tab, not Bookmark. Selecting disables (does not hide). */
export function youLibraryShowsDesignAdd(input: {
  tab: 'products' | 'collections' | 'catalogs';
  youSaved: boolean;
}): boolean {
  return input.tab === 'products' && !input.youSaved;
}

/** Pack / design create rows stay on screen while Selecting. */
export function youLibraryCreateRowDisabled(selecting: boolean): boolean {
  return selecting;
}

/** Designs select ⋯ is always on while something is selected (Add, even with no Hide/Delete). */
export function youLibraryShowsDesignSelectMore(input: {
  tab: 'products' | 'collections' | 'catalogs';
  selectedCount: number;
}): boolean {
  return input.tab === 'products' && input.selectedCount > 0;
}
