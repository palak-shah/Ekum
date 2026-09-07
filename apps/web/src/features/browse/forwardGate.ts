/** Curate / relist locked (Forward is free). */
export const RELIST_LOCKED_TOAST = "This seller doesn't allow putting this in a pack.";

export function canRelistFlag(allowRelist: boolean | undefined): boolean {
  return allowRelist !== false;
}
