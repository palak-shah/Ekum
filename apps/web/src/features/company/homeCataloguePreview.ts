/** How many published packs to show on Home / visitor shop before See all (match 4 design tiles). */
export const HOME_CATALOGUE_COLLECTION_PREVIEW = 4;
/** How many published designs to show on Home / visitor shop preview (2×2). */
export const HOME_CATALOGUE_DESIGN_PREVIEW = 4;

/** Slice the shelf for profile-face preview; pass `preview: false` for the full catalogue page. */
export function cataloguePreviewSlice<T>(rows: T[], limit: number, preview: boolean): T[] {
  if (!preview) return rows;
  return rows.slice(0, limit);
}

/** @deprecated Prefer cataloguePreviewSlice — same behaviour. */
export const homeCatalogueSlice = cataloguePreviewSlice;

/** Home / visitor catalogue footer — tab-aware prototype copy. */
export function seeAllCatalogueLabel(shopTab: 'collections' | 'designs'): string {
  return shopTab === 'designs' ? 'See all designs >' : 'See all collections >';}
