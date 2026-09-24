export const CURATE_NAME_TAKEN = 'You already have this pack.';
export const CURATE_ADD_TO_IT = 'Add to it';
export const CURATE_NOT_VISIBLE_REASON = "Can't see this now";

export function curateBlockReason(code: string | undefined): string {
  if (code === 'RELIST_NOT_ALLOWED') return "Can't put in a pack";
  return CURATE_NOT_VISIBLE_REASON;
}

export function curateBlockedIdSet(
  blocked: { productId: string; code: string }[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of blocked ?? []) {
    map.set(row.productId, curateBlockReason(row.code));
  }
  return map;
}
