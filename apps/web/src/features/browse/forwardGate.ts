/** Curate / relist locked (Forward is free). */
export const RELIST_LOCKED_TOAST = "This seller doesn't allow putting this in a pack.";

export function canRelistFlag(allowRelist: boolean | undefined): boolean {
  return allowRelist !== false;
}

/** Pack allowed when product allowForward, grant, or source pack allow-to-relist. */
export function canPutInPack(
  allowForward: boolean | undefined,
  hasGrant: boolean,
  sourcePackAllowForward?: boolean,
): boolean {
  return (
    canRelistFlag(allowForward) || hasGrant || sourcePackAllowForward === true
  );
}
