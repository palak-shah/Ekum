import type { BrowseShortlistEntry } from './browseShortlist';

/** One curated pack on every line — always from-pack (main + linked lots). */
export function singleSourceCollectionId(
  entries: Array<Pick<BrowseShortlistEntry, 'sourceCollectionId'>>,
): string | null {
  if (entries.length === 0) return null;
  const id = entries[0]?.sourceCollectionId?.trim();
  if (!id) return null;
  return entries.every((row) => row.sourceCollectionId === id) ? id : null;
}

export function packHandlerName(
  entries: Array<Pick<BrowseShortlistEntry, 'sourceHandlerName'>>,
): string | null {
  const name = entries.find((row) => row.sourceHandlerName?.trim())?.sourceHandlerName?.trim();
  return name || null;
}

export function isHandlePackPath(path: string | null | undefined): boolean {
  return path === 'handle';
}

/**
 * Curated pack Place → from-pack (one main + linked mill lots).
 * Direct/transparent is visibility on that desk, not batch Place.
 */
export function collectionIdForPackOrder(
  entries: Array<Pick<BrowseShortlistEntry, 'sourceCollectionId' | 'sourcePath'>>,
): string | undefined {
  return singleSourceCollectionId(entries) ?? undefined;
}

/** Own albums are normal batch — not Manage from-pack. */
export function shouldFallbackPackOrderToBatch(code: string | undefined): boolean {
  // DIRECT_PACK retired — API no longer throws it; do not treat unknown codes as batch.
  return code === 'NOT_CURATED';
}
