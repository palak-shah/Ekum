/** Home catalogue tab ↔ URL `tab=` (You uses `products`; Home UI uses `designs`). */

export type HomeCatalogueTab = 'collections' | 'designs';

export function homeCatalogueTabFromSearch(tab: string | null): HomeCatalogueTab | null {
  if (tab === 'products' || tab === 'designs') return 'designs';
  if (tab === 'collections') return 'collections';
  return null;
}

export function homeCatalogueSearchParam(shopTab: HomeCatalogueTab): 'collections' | 'products' {
  return shopTab === 'designs' ? 'products' : 'collections';
}

/** You Back → Home with the same catalogue kind still selected. */
export function youBackHomeHref(youTab: string | null): string {
  const home = homeCatalogueTabFromSearch(youTab);
  if (!home) return '/';
  return `/?tab=${homeCatalogueSearchParam(home)}`;
}
