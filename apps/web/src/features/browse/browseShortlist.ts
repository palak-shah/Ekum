export const STORAGE_KEY = 'ekum:browseShortlist';

export type BrowseShortlistEntry = {
  productId: string;
  name: string;
  thumbUrl: string | null;
  companyId: string;
  companyName: string;
  allowForward?: boolean;
};

type Listener = () => void;
const listeners = new Set<Listener>();

/** Snapshot cache so useSyncExternalStore gets a stable reference when unchanged. */
let cachedRaw: string | null = null;
let cachedEntries: BrowseShortlistEntry[] = [];

function canUseStorage(): boolean {
  return typeof sessionStorage !== 'undefined';
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeBrowseShortlist(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function parseEntries(raw: string | null): BrowseShortlistEntry[] {
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

export function readBrowseShortlist(): BrowseShortlistEntry[] {
  if (!canUseStorage()) return cachedEntries;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedEntries;
    cachedRaw = raw;
    cachedEntries = parseEntries(raw);
    return cachedEntries;
  } catch {
    return cachedEntries;
  }
}

export function writeBrowseShortlist(entries: BrowseShortlistEntry[]): void {
  cachedEntries = entries;
  cachedRaw = entries.length === 0 ? null : JSON.stringify(entries);
  if (canUseStorage()) {
    try {
      if (entries.length === 0) sessionStorage.removeItem(STORAGE_KEY);
      else sessionStorage.setItem(STORAGE_KEY, cachedRaw!);
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
  emit();
}

export function toggleBrowseShortlistEntry(entry: BrowseShortlistEntry): BrowseShortlistEntry[] {
  const current = readBrowseShortlist();
  const exists = current.some((row) => row.productId === entry.productId);
  const next = exists
    ? current.filter((row) => row.productId !== entry.productId)
    : [...current.filter((row) => row.productId !== entry.productId), entry];
  writeBrowseShortlist(next);
  return next;
}

export function removeBrowseShortlistIds(productIds: string[]): BrowseShortlistEntry[] {
  const drop = new Set(productIds);
  const next = readBrowseShortlist().filter((row) => !drop.has(row.productId));
  writeBrowseShortlist(next);
  return next;
}

export function clearBrowseShortlist(): void {
  writeBrowseShortlist([]);
}

export function addBrowseShortlistMany(entries: BrowseShortlistEntry[]): BrowseShortlistEntry[] {
  const byId = new Map(readBrowseShortlist().map((row) => [row.productId, row]));
  for (const entry of entries) {
    byId.set(entry.productId, entry);
  }
  const next = [...byId.values()];
  writeBrowseShortlist(next);
  return next;
}
