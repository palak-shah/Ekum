export const CURATE_NAME_TAKEN = 'You already have this pack.';
export const CURATE_ADD_TO_IT = 'Add to it';
export const CURATE_NOT_VISIBLE_REASON = "Can't see this now";
export const CURATE_PACK_LOCK_REASON = "Can't put in a pack";
export const CURATE_ASK_RELIST = 'Ask to put in my pack';

/** Pack Ask only when supplier locked “buyers can add to collections” — never look-only or view-Ask. */
export function mayAskToPutInPack(input: {
  trading: boolean;
  ownCompany: boolean;
  waiting?: boolean;
  packLocked: boolean;
  lookOnly: boolean;
}): boolean {
  return (
    input.trading &&
    !input.ownCompany &&
    !input.waiting &&
    input.packLocked &&
    !input.lookOnly
  );
}

export function curateBlockReason(code: string | undefined): string {
  if (code === 'RELIST_NOT_ALLOWED' || code === 'FOLLOW_LOOK_ONLY') {
    return CURATE_PACK_LOCK_REASON;
  }
  return CURATE_NOT_VISIBLE_REASON;
}

/** Relist Ask is only RELIST_NOT_ALLOWED. Look-only / not-visible are not pack-Ask doors. */
export function curateAskKind(code: string | undefined): 'relist' | null {
  if (code === 'RELIST_NOT_ALLOWED') return 'relist';
  return null;
}

export function curateAskAllLabel(count: number): string {
  if (count <= 1) return CURATE_ASK_RELIST;
  return `Ask for all ${count}`;
}

export function curateSkipSummary(allowedCount: number, blockedCount: number): string | null {
  if (blockedCount < 1) return null;
  if (allowedCount < 1) {
    return blockedCount === 1
      ? 'This design can’t go in a pack yet.'
      : 'These designs can’t go in a pack yet.';
  }
  return `${blockedCount} left out — save the rest.`;
}

export function curateSaveDraftLabel(allowedCount: number, blockedCount: number): string {
  if (blockedCount < 1 || allowedCount < 1) return 'Save draft';
  return `Save ${allowedCount} in this pack`;
}

export function isCurateCeilingError(err: { code?: string; message?: string }): boolean {
  const code = err.code ?? '';
  if (
    code === 'NOT_DISCOVERABLE' ||
    code === 'RELIST_NOT_ALLOWED' ||
    code === 'FOLLOW_LOOK_ONLY' ||
    code === 'INVALID_PRODUCTS'
  ) {
    return true;
  }
  const message = err.message ?? '';
  return (
    message.includes('not visible to you') ||
    message.includes("doesn't allow putting this in a pack") ||
    message.includes("haven't allowed putting their designs")
  );
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

export function partitionCurateByCheck<T extends { productId: string }>(
  entries: T[],
  check: { allowedProductIds: string[]; blocked: { productId: string; code: string }[] } | undefined,
): { allowed: T[]; blocked: Array<T & { code: string }> } {
  if (!check) return { allowed: entries, blocked: [] };
  const codeById = new Map(check.blocked.map((row) => [row.productId, row.code]));
  const allowedIds = new Set(check.allowedProductIds);
  const allowed: T[] = [];
  const blocked: Array<T & { code: string }> = [];
  for (const entry of entries) {
    if (allowedIds.has(entry.productId)) {
      allowed.push(entry);
      continue;
    }
    blocked.push({ ...entry, code: codeById.get(entry.productId) ?? 'NOT_DISCOVERABLE' });
  }
  return { allowed, blocked };
}

export function groupRelistAskBatches(
  entries: { productId: string; sourceCollectionId?: string }[],
): { productIds: string[]; sourceCollectionId?: string }[] {
  const map = new Map<string, string[]>();
  for (const entry of entries) {
    const key = entry.sourceCollectionId ?? '';
    const list = map.get(key) ?? [];
    list.push(entry.productId);
    map.set(key, list);
  }
  return [...map.entries()].map(([key, productIds]) =>
    key ? { productIds, sourceCollectionId: key } : { productIds },
  );
}
