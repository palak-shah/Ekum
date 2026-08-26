const STORAGE_PREFIX = 'ekum.exploreFeedSeen';
const MAX_ENTRIES = 400;

interface SeenRecord {
  activityAt: string;
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

/** User opened this post — hide until it has newer activity. */
export function markExplorePostSeen(companyId: string, postId: string, activityAt: string) {
  const map = loadMap(companyId);
  map[postId] = { activityAt };
  saveMap(companyId, map);
}

export function isExplorePostUnseen(
  companyId: string | undefined,
  postId: string,
  activityAt: string,
  seenMap?: Record<string, SeenRecord>,
): boolean {
  if (!companyId) return true;
  const map = seenMap ?? loadMap(companyId);
  const seen = map[postId];
  if (!seen) return true;
  return Date.parse(activityAt) > Date.parse(seen.activityAt);
}

export function loadExploreFeedSeenMap(companyId: string | undefined): Record<string, SeenRecord> {
  if (!companyId) return {};
  return loadMap(companyId);
}
