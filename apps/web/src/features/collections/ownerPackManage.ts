/**
 * Own-pack manage dock: membership remove vs hard-delete, and multi-pack fork.
 */

/** How many other owned packs (by name) this design is in. */
export function otherPackCountFromNames(
  collectionNames: readonly string[],
  currentPackName: string,
): number {
  const current = currentPackName.trim().toLowerCase();
  return collectionNames.filter((name) => name.trim().toLowerCase() !== current).length;
}

export type OtherPackCountRow = { productId: string; otherPackCount: number };

/** True when any selected owned design also lives in another pack. */
export function deleteNeedsMultiPackConfirm(
  selectedIds: readonly string[],
  counts: readonly OtherPackCountRow[],
  ownedIds: ReadonlySet<string>,
): boolean {
  const byId = new Map(counts.map((row) => [row.productId, row.otherPackCount]));
  return selectedIds.some(
    (id) => ownedIds.has(id) && (byId.get(id) ?? 0) > 0,
  );
}

/** Own designs among the selection (mill designs stay references). */
export function ownedSelectedIds(
  selectedIds: readonly string[],
  productCompanyById: ReadonlyMap<string, string>,
  myCompanyId: string,
): string[] {
  return selectedIds.filter((id) => productCompanyById.get(id) === myCompanyId);
}

/** Own library or mill designs you curated into this pack. */
export function canDeleteSelected(selectedIds: readonly string[]): boolean {
  return selectedIds.length > 0;
}

/** Remaining membership after removing selected ids. */
export function membershipAfterRemove(
  currentIds: readonly string[],
  removeIds: readonly string[],
): string[] {
  const drop = new Set(removeIds);
  return currentIds.filter((id) => !drop.has(id));
}

/** New members first (album order); existing keep their relative order. */
export function membershipWithNewFirst(
  currentIds: readonly string[],
  addedIds: readonly string[],
): string[] {
  const added: string[] = [];
  const seen = new Set<string>();
  for (const id of addedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    added.push(id);
  }
  const rest = currentIds.filter((id) => !seen.has(id));
  return [...added, ...rest];
}

/**
 * Replace waits until a non-empty set is saved — boot must never clear members.
 * (Regression guard for the old `productIds: []` PUT.)
 */
export function replaceBootClearsMembership(): boolean {
  return false;
}

/**
 * Replace → only the picked ids (deduped, pick order). Empty pick → null (keep current; do not PUT).
 * Append → new ids first via {@link membershipWithNewFirst}.
 */
export function membershipForReplaceOrAppend(
  currentIds: readonly string[],
  pickedIds: readonly string[],
  replace: boolean,
): string[] | null {
  if (replace) {
    if (pickedIds.length === 0) return null;
    const next: string[] = [];
    const seen = new Set<string>();
    for (const id of pickedIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      next.push(id);
    }
    return next;
  }
  return membershipWithNewFirst(currentIds, pickedIds);
}
