/** Trailing Add designs square — Designs tab only, idle library (not Bookmark / Select). */
export function youLibraryShowsDesignAdd(input: {
  tab: 'products' | 'collections' | 'catalogs';
  youSaved: boolean;
  selecting: boolean;
}): boolean {
  return input.tab === 'products' && !input.youSaved && !input.selecting;
}

/** Designs select ⋯ is always on while something is selected (Add, even with no Hide/Delete). */
export function youLibraryShowsDesignSelectMore(input: {
  tab: 'products' | 'collections' | 'catalogs';
  selectedCount: number;
}): boolean {
  return input.tab === 'products' && input.selectedCount > 0;
}
