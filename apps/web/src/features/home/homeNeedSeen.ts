import type { HomeNeedItem } from './homeAttention';

const STORAGE_PREFIX = 'ekum.homeNeedsSeen';
const MAX_ENTRIES = 200;

interface SeenRecord {
  sortAt: string;
}

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}.${companyId}`;
}

function loadMap(companyId: string): Record<string, SeenRecord> {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SeenRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveMap(companyId: string, map: Record<string, SeenRecord>) {
  const entries = Object.entries(map);
  const trimmed =
    entries.length <= MAX_ENTRIES
      ? map
      : Object.fromEntries(entries.slice(entries.length - MAX_ENTRIES));
  localStorage.setItem(storageKey(companyId), JSON.stringify(trimmed));
}

/** User opened this need — hide until the bucket has newer activity. */
export function markHomeNeedSeen(companyId: string, id: string, sortAt: string) {
  const map = loadMap(companyId);
  map[id] = { sortAt };
  saveMap(companyId, map);
}

/**
 * Drop needs the user already viewed at this activity level.
 * Re-show only when sortAt moves forward (new work in that bucket).
 */
export function filterSeenHomeNeeds(
  companyId: string | undefined,
  needs: HomeNeedItem[],
): HomeNeedItem[] {
  if (!companyId) return needs;
  const map = loadMap(companyId);
  return needs.filter((need) => {
    const seen = map[need.id];
    if (!seen) return true;
    return Date.parse(need.sortAt) > Date.parse(seen.sortAt);
  });
}
