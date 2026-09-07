export const ALBUM_PICK_STORAGE_KEY = 'ekum:browseAlbumPick';

export type BrowseAlbumEntry = {
  collectionId: string;
  name: string;
  coverImage: string | null;
  companyId: string;
  companyName: string;
  productCount?: number;
  allowForward?: boolean;
  orderPathPreference?: string | null;
};

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedRaw: string | null = null;
let cachedEntries: BrowseAlbumEntry[] = [];

function canUseStorage(): boolean {
  return typeof sessionStorage !== 'undefined';
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeBrowseAlbumPick(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function parseEntries(raw: string | null): BrowseAlbumEntry[] {
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

export function readBrowseAlbumPick(): BrowseAlbumEntry[] {
  if (!canUseStorage()) return cachedEntries;
  try {
    const raw = sessionStorage.getItem(ALBUM_PICK_STORAGE_KEY);
    if (raw === cachedRaw) return cachedEntries;
    cachedRaw = raw;
    cachedEntries = parseEntries(raw);
    return cachedEntries;
  } catch {
    return cachedEntries;
  }
}

export function writeBrowseAlbumPick(entries: BrowseAlbumEntry[]): void {
  cachedEntries = entries;
  cachedRaw = entries.length === 0 ? null : JSON.stringify(entries);
  if (canUseStorage()) {
    try {
      if (entries.length === 0) sessionStorage.removeItem(ALBUM_PICK_STORAGE_KEY);
      else sessionStorage.setItem(ALBUM_PICK_STORAGE_KEY, cachedRaw!);
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
  emit();
}

export function toggleBrowseAlbumEntry(entry: BrowseAlbumEntry): BrowseAlbumEntry[] {
  const current = readBrowseAlbumPick();
  const exists = current.some((row) => row.collectionId === entry.collectionId);
  const next = exists
    ? current.filter((row) => row.collectionId !== entry.collectionId)
    : [...current.filter((row) => row.collectionId !== entry.collectionId), entry];
  writeBrowseAlbumPick(next);
  return next;
}

export function clearBrowseAlbumPick(): void {
  writeBrowseAlbumPick([]);
}

export function removeBrowseAlbumIds(collectionIds: string[]): BrowseAlbumEntry[] {
  const drop = new Set(collectionIds);
  const next = readBrowseAlbumPick().filter((row) => !drop.has(row.collectionId));
  writeBrowseAlbumPick(next);
  return next;
}
