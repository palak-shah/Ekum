export type CatalogStatusFilter = 'draft' | 'published' | 'archived';

/** Chip order and first-open default on My designs (Designs + Collections). */
export const CATALOG_STATUS_FILTERS: { id: CatalogStatusFilter; label: string }[] = [
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
  { id: 'archived', label: 'Archived' },
];

export const DEFAULT_CATALOG_LIST_FILTER: CatalogStatusFilter = 'published';

const STORAGE_PREFIX = 'ekum.catalogListFilter';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}.${companyId}`;
}

function isFilter(value: unknown): value is CatalogStatusFilter {
  return value === 'draft' || value === 'published' || value === 'archived';
}

export function readCatalogListFilter(
  companyId: string | null | undefined,
  which: 'products' | 'collections',
): CatalogStatusFilter | null {
  if (!companyId) return null;
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { products?: unknown; collections?: unknown };
    const value = which === 'products' ? parsed.products : parsed.collections;
    return isFilter(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeCatalogListFilter(
  companyId: string | null | undefined,
  which: 'products' | 'collections',
  filter: CatalogStatusFilter,
): void {
  if (!companyId || !isFilter(filter)) return;
  try {
    const key = storageKey(companyId);
    let current: { products?: string; collections?: string } = {};
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        current = JSON.parse(raw) as { products?: string; collections?: string };
      } catch {
        current = {};
      }
    }
    current[which] = filter;
    localStorage.setItem(key, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

/** One library / shop row per design, even if it sits in many collections. */
export function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const next: T[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    next.push(row);
  }
  return next;
}

/** Draft Designs looks empty when pack photos already went Published (In packs / On Explore). */
export function publishedDesignsElsewhereHint(publishedCount: number): string | null {
  if (publishedCount < 1) return null;
  return publishedCount === 1
    ? '1 design is on Published (including packs).'
    : `${publishedCount} designs are on Published (including packs).`;
}
