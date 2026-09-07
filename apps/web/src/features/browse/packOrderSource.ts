import type { BrowseShortlistEntry } from './browseShortlist';

/** One curated pack on every line — I handle from-pack, not mill batch. */
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

/** Skip from-pack when the pack is explicitly Direct. */
export function collectionIdForPackOrder(
  entries: Array<Pick<BrowseShortlistEntry, 'sourceCollectionId' | 'sourcePath'>>,
): string | undefined {
  const id = singleSourceCollectionId(entries);
  if (!id) return undefined;
  if (entries.every((row) => row.sourcePath === 'direct')) return undefined;
  return id;
}

/** Own albums and Direct packs are normal batch orders — not Manage from-pack. */
export function shouldFallbackPackOrderToBatch(code: string | undefined): boolean {
  return code === 'DIRECT_PACK' || code === 'NOT_CURATED';
}
