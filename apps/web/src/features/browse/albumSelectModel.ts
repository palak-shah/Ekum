import type { BrowseShortlistEntry } from './browseShortlist';

export type OrderAlbumChoice = 'all' | 'choose';

export function pickSelectionLabel(albumCount: number, designCount: number): string {
  if (albumCount > 0 && designCount > 0) {
    return `${designCount} design${designCount === 1 ? '' : 's'} · ${albumCount} collection${albumCount === 1 ? '' : 's'}`;
  }
  if (albumCount > 0) {
    return albumCount === 1 ? '1 collection selected' : `${albumCount} collections selected`;
  }
  if (designCount === 1) return '1 selected';
  return `${designCount} selected`;
}

/** Dock verbs stay stable; Curate still needs Trading on. */
export function shouldShowAlbumSelectActions(input: {
  designCount: number;
  albumCount: number;
  trading: boolean;
}): { order: boolean; curate: boolean; bookmark: boolean; share: boolean } {
  const any = input.designCount + input.albumCount > 0;
  return {
    order: any,
    curate: any && input.trading,
    bookmark: any,
    share: any,
  };
}

export function orderResolveSummary(designCount: number, albumCount: number): string {
  if (designCount > 0 && albumCount > 0) {
    return `You selected ${designCount} design${designCount === 1 ? '' : 's'} + ${albumCount} collection${albumCount === 1 ? '' : 's'}.`;
  }
  if (albumCount > 0) {
    return `You selected ${albumCount} collection${albumCount === 1 ? '' : 's'}.`;
  }
  return `You selected ${designCount} design${designCount === 1 ? '' : 's'}.`;
}

/** Same summary sentences as Order (Curate resolve sheet). */
export function curateResolveSummary(designCount: number, albumCount: number): string {
  return orderResolveSummary(designCount, albumCount);
}

/** Existing shortlist wins on id clash (dedupe). */
export function mergeShortlistWithProducts(
  existing: BrowseShortlistEntry[],
  incoming: BrowseShortlistEntry[],
): BrowseShortlistEntry[] {
  const byId = new Map(existing.map((row) => [row.productId, row]));
  for (const entry of incoming) {
    if (!byId.has(entry.productId)) byId.set(entry.productId, entry);
  }
  return [...byId.values()];
}
