import { CollectionKind, CollectionStatus } from '@ekum/domain-types';
import type { YouLibraryTab } from '@/features/saved/youSavedHref';

export const YOU_LIBRARY_TABS: Array<{ id: YouLibraryTab; label: string; testId: string }> = [
  { id: 'collections', label: 'Collections', testId: 'you-tab-collections' },
  { id: 'catalogs', label: 'Catalogs', testId: 'you-tab-catalogs' },
  { id: 'products', label: 'Designs', testId: 'you-tab-designs' },
];

export function isGeneralCollection(kind?: string | null): boolean {
  return kind === CollectionKind.General;
}

/** Pack apply-all / Order and dispatch — not General Collection (leftover bouquet). */
export function collectionShowsPackOrderChrome(kind?: string | null): boolean {
  return !isGeneralCollection(kind);
}

/** Pack Rate · tags on the album identity line — not General Collection. */
export function collectionShowsPackIdentityFacts(kind?: string | null): boolean {
  return collectionShowsPackOrderChrome(kind);
}

export function isCatalogCollection(kind?: string | null): boolean {
  return kind === CollectionKind.Catalog;
}

export function isPackTab(tab: YouLibraryTab): tab is 'collections' | 'catalogs' {
  return tab === 'collections' || tab === 'catalogs';
}

export function collectionsForYouTab<T extends { kind?: string }>(
  rows: readonly T[],
  tab: 'collections' | 'catalogs',
): T[] {
  return rows.filter((row) =>
    tab === 'catalogs' ? isCatalogCollection(row.kind) : !isCatalogCollection(row.kind),
  );
}

export function pinGeneralCollectionFirst<T extends { kind?: string }>(rows: readonly T[]): T[] {
  const general = rows.filter((row) => isGeneralCollection(row.kind));
  const rest = rows.filter((row) => !isGeneralCollection(row.kind));
  return [...general, ...rest];
}

export function generalCollectionBadge(kind?: string | null): string | null {
  return isGeneralCollection(kind) ? 'General Collection' : null;
}

export function treatReadyAsDraft(status: string): boolean {
  return status === CollectionStatus.Draft || status === CollectionStatus.Ready;
}

export function youLibraryDeletedMenuLabel(tab: YouLibraryTab): string {
  if (tab === 'catalogs') return 'Deleted catalogs';
  if (tab === 'products') return 'Deleted designs';
  return 'Deleted collections';
}

/** Create & Publish / leave-to-list: catalog home is Catalogs, not Collections. */
export function youLibraryHrefAfterPackPublish(kind?: string | null): string {
  return isCatalogCollection(kind) ? '/catalog?tab=catalogs' : '/catalog?tab=collections';
}

export function removeFromThisPackLabel(kind?: string | null): string {
  return isCatalogCollection(kind)
    ? 'Remove from this catalog'
    : 'Remove from this collection';
}

export function removedFromPackToast(kind?: string | null): string {
  return isCatalogCollection(kind) ? 'Removed from catalog' : 'Removed from collection';
}

export function deletedFromThisPackToast(kind?: string | null): string {
  return isCatalogCollection(kind)
    ? 'Deleted from this catalog'
    : 'Deleted from this collection';
}
