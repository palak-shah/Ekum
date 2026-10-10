import type { BrowseAlbumEntry } from '@/features/browse/browseAlbumPick';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { isOwnProfileEditing } from '@/features/settings/profileEdit';

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

export function shouldShowShopTradeDock(options: {
  isOwn: boolean;
  shopSelectedCount: number;
}): boolean {
  return !options.isOwn && options.shopSelectedCount > 0;
}

/** Hide Home · Chats · ＋ · Explore · Orders when a focused job owns the bottom. */
export function shouldHideAppNav(
  pathname: string,
  options: {
    myCompanyId?: string | null;
    thisShopSelectedCount: number;
    search?: string;
    pageDockUp?: boolean;
    /** Traveling Selection dock owns the bottom band. */
    selectionWorkspaceUp?: boolean;
  },
): boolean {
  if (options.selectionWorkspaceUp) return true;
  if (isOwnProfileEditing(pathname, options.search)) return true;
  if (pathname === '/selection' || pathname.startsWith('/selection/')) return true;
  if (pathname.startsWith('/designs/set') && options.pageDockUp) return true;
  if (/^\/collections\/[^/]+$/.test(pathname) && options.pageDockUp) return true;
  if (/^\/explore\/products\/[^/]+$/.test(pathname) && options.pageDockUp) return true;
  // You library select dock (Order · Share · Hide) owns the bottom — same as pack manage.
  if (pathname === '/more' && options.pageDockUp) return true;
  if (
    pathname === '/catalog/collections/new' ||
    /^\/catalog\/collections\/[^/]+$/.test(pathname)
  ) {
    return true;
  }
  const match = pathname.match(/^\/company\/([^/]+)/);
  if (!match) return false;
  const shopId = match[1]!;
  // Own shop keeps the shell (like You). Other shops hide nav — Instagram / WhatsApp deep profile.
  if (options.myCompanyId && shopId === options.myCompanyId) return false;
  return true;
}

export function companyIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/company\/([^/]+)/);
  return match?.[1] ?? null;
}
