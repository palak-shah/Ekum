import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';

export const CART_DESIGNS_KEY = 'ekum:browseCartDesigns';
export const CART_ALBUMS_KEY = 'ekum:browseCartAlbums';

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedDesignsRaw: string | null = null;
let cachedDesigns: BrowseShortlistEntry[] = [];
let cachedAlbumsRaw: string | null = null;
let cachedAlbums: BrowseAlbumEntry[] = [];

function canUseStorage(): boolean {
  return typeof sessionStorage !== 'undefined';
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeBrowseCart(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function parseDesigns(raw: string | null): BrowseShortlistEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is BrowseShortlistEntry =>
        Boolean(
          row &&
            typeof row === 'object' &&
            typeof (row as BrowseShortlistEntry).productId === 'string' &&
            typeof (row as BrowseShortlistEntry).name === 'string' &&
            typeof (row as BrowseShortlistEntry).companyId === 'string' &&
            typeof (row as BrowseShortlistEntry).companyName === 'string',
        ),
    );
  } catch {
    return [];
  }
}

function parseAlbums(raw: string | null): BrowseAlbumEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is BrowseAlbumEntry =>
        Boolean(
          row &&
            typeof row === 'object' &&
            typeof (row as BrowseAlbumEntry).collectionId === 'string' &&
            typeof (row as BrowseAlbumEntry).name === 'string' &&
            typeof (row as BrowseAlbumEntry).companyId === 'string' &&
            typeof (row as BrowseAlbumEntry).companyName === 'string',
        ),
    );
  } catch {
    return [];
  }
}

export function readCartDesigns(): BrowseShortlistEntry[] {
  if (!canUseStorage()) return cachedDesigns;
  try {
    const raw = sessionStorage.getItem(CART_DESIGNS_KEY);
    if (raw === cachedDesignsRaw) return cachedDesigns;
    cachedDesignsRaw = raw;
    cachedDesigns = parseDesigns(raw);
    return cachedDesigns;
  } catch {
    return cachedDesigns;
  }
}

export function readCartAlbums(): BrowseAlbumEntry[] {
  if (!canUseStorage()) return cachedAlbums;
  try {
    const raw = sessionStorage.getItem(CART_ALBUMS_KEY);
    if (raw === cachedAlbumsRaw) return cachedAlbums;
    cachedAlbumsRaw = raw;
    cachedAlbums = parseAlbums(raw);
    return cachedAlbums;
  } catch {
    return cachedAlbums;
  }
}

export function cartCount(): number {
  return readCartDesigns().length + readCartAlbums().length;
}

export function writeCartDesigns(entries: BrowseShortlistEntry[]): void {
  cachedDesigns = entries;
  cachedDesignsRaw = entries.length === 0 ? null : JSON.stringify(entries);
  if (canUseStorage()) {
    try {
      if (entries.length === 0) sessionStorage.removeItem(CART_DESIGNS_KEY);
      else sessionStorage.setItem(CART_DESIGNS_KEY, cachedDesignsRaw!);
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
  emit();
}

export function writeCartAlbums(entries: BrowseAlbumEntry[]): void {
  cachedAlbums = entries;
  cachedAlbumsRaw = entries.length === 0 ? null : JSON.stringify(entries);
  if (canUseStorage()) {
    try {
      if (entries.length === 0) sessionStorage.removeItem(CART_ALBUMS_KEY);
      else sessionStorage.setItem(CART_ALBUMS_KEY, cachedAlbumsRaw!);
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
  emit();
}

export function addCartDesignsMany(incoming: BrowseShortlistEntry[]): BrowseShortlistEntry[] {
  const byId = new Map(readCartDesigns().map((row) => [row.productId, row]));
  for (const entry of incoming) {
    byId.set(entry.productId, entry);
  }
  const next = [...byId.values()];
  writeCartDesigns(next);
  return next;
}

export function addCartAlbumsMany(incoming: BrowseAlbumEntry[]): BrowseAlbumEntry[] {
  const byId = new Map(readCartAlbums().map((row) => [row.collectionId, row]));
  for (const entry of incoming) {
    byId.set(entry.collectionId, entry);
  }
  const next = [...byId.values()];
  writeCartAlbums(next);
  return next;
}

export function removeCartDesignIds(productIds: string[]): BrowseShortlistEntry[] {
  const drop = new Set(productIds);
  const next = readCartDesigns().filter((row) => !drop.has(row.productId));
  writeCartDesigns(next);
  return next;
}

export function removeCartAlbumIds(collectionIds: string[]): BrowseAlbumEntry[] {
  const drop = new Set(collectionIds);
  const next = readCartAlbums().filter((row) => !drop.has(row.collectionId));
  writeCartAlbums(next);
  return next;
}

export function clearBrowseCart(): void {
  writeCartDesigns([]);
  writeCartAlbums([]);
}
