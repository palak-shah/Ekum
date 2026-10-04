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

/** Own designs among the selection (foreign curated → Remove only). */
export function ownedSelectedIds(
  selectedIds: readonly string[],
  productCompanyById: ReadonlyMap<string, string>,
  myCompanyId: string,
): string[] {
  return selectedIds.filter((id) => productCompanyById.get(id) === myCompanyId);
}

export function canDeleteSelected(
  selectedIds: readonly string[],
  productCompanyById: ReadonlyMap<string, string>,
  myCompanyId: string,
): boolean {
  return ownedSelectedIds(selectedIds, productCompanyById, myCompanyId).length > 0;
}

/** Remaining membership after removing selected ids. */
export function membershipAfterRemove(
  currentIds: readonly string[],
  removeIds: readonly string[],
): string[] {
  const drop = new Set(removeIds);
  return currentIds.filter((id) => !drop.has(id));
}
