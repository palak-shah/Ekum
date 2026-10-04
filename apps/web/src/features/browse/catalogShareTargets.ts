/** Dedupe company ids for multi-buyer catalog Share (chat delivery). */
export function dedupeCompanyIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export type CatalogShareGroup = {
  id: string;
  memberCompanyIds: string[];
};

/**
 * Companies + selected buyer groups → unique shops (once even if in two groups).
 * Group members outside `eligibleCompanyIds` are dropped (disconnected / stale).
 */
export function catalogShareRecipientIds(input: {
  selectedCompanyIds: string[];
  selectedGroupIds: string[];
  groups: CatalogShareGroup[];
  eligibleCompanyIds?: Iterable<string>;
}): string[] {
  const selectedGroups = input.groups.filter((group) =>
    input.selectedGroupIds.includes(group.id),
  );
  const fromGroups = selectedGroups.flatMap((group) => group.memberCompanyIds);
  const merged = dedupeCompanyIds([...input.selectedCompanyIds, ...fromGroups]);
  if (!input.eligibleCompanyIds) return merged;
  const allowed = new Set(
    [...input.eligibleCompanyIds].map((id) => id.trim()).filter(Boolean),
  );
  const picked = new Set(dedupeCompanyIds(input.selectedCompanyIds));
  return merged.filter((id) => picked.has(id) || allowed.has(id));
}

/** Open the thread only when sharing to exactly one company. */
export function shouldOpenChatAfterCatalogShare(recipientCount: number): boolean {
  return recipientCount === 1;
}

export function catalogShareToastLabel(input: {
  recipientCount: number;
  singleName?: string | null;
}): string {
  if (input.recipientCount === 1) {
    return `Shared with ${input.singleName?.trim() || 'chat'}`;
  }
  return `Shared with ${input.recipientCount}`;
}
