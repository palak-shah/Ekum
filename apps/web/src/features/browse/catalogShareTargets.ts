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
