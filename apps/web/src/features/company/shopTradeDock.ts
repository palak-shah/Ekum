import type { BrowseAlbumEntry } from '@/features/browse/browseAlbumPick';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';

export function shopShortlistEntries(
  entries: BrowseShortlistEntry[],
  shopCompanyId: string,
  visibleProductIds: readonly string[] = [],
): BrowseShortlistEntry[] {
  if (!shopCompanyId && visibleProductIds.length === 0) return [];
  const onGrid = new Set(visibleProductIds);
  return entries.filter(
    (entry) => entry.companyId === shopCompanyId || onGrid.has(entry.productId),
  );
}

export function shopAlbumEntries(
  entries: BrowseAlbumEntry[],
  shopCompanyId: string,
  visibleCollectionIds: readonly string[] = [],
): BrowseAlbumEntry[] {
  if (!shopCompanyId && visibleCollectionIds.length === 0) return [];
  const onGrid = new Set(visibleCollectionIds);
  return entries.filter(
    (entry) => entry.companyId === shopCompanyId || onGrid.has(entry.collectionId),
  );
}

export function shopSelectedCount(
  designs: BrowseShortlistEntry[],
  albums: BrowseAlbumEntry[],
  shopCompanyId: string,
  visibleProductIds: readonly string[] = [],
  visibleCollectionIds: readonly string[] = [],
): number {
  return (
    shopShortlistEntries(designs, shopCompanyId, visibleProductIds).length +
    shopAlbumEntries(albums, shopCompanyId, visibleCollectionIds).length
  );
}

/** Select-all pill count for the active shop tab — designs and collections stay separate. */
export function shopTabSelectedCount(
  tab: 'designs' | 'collections',
  designCount: number,
  albumCount: number,
): number {
  return tab === 'designs' ? designCount : albumCount;
}

/** Message · Share · Order when this shop has picks — own shop too (Message muted in UI). */
export function shouldShowShopTradeDock(options: {
  isOwn: boolean;
  shopSelectedCount: number;
}): boolean {
  void options.isOwn;
  return options.shopSelectedCount > 0;
}

export function companyIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/company\/([^/]+)/);
  return match?.[1] ?? null;
}
