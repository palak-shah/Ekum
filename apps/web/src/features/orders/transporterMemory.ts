const HISTORY_KEY = 'ekum:transporter:history:v1';
const HISTORY_CAP = 20;

export function transporterLastKey(sellerId: string) {
  return `ekum:transporter:last:v1:${sellerId || 'multi'}`;
}

function readHistoryRaw(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is string => typeof row === 'string')
      .map((row) => row.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeHistory(names: string[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(names.slice(0, HISTORY_CAP)));
  } catch {
    // ignore
  }
}

/** Newest-first unique transporter names from this device. */
export function listTransporterHistory(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of readHistoryRaw()) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= HISTORY_CAP) break;
  }
  return out;
}

export function readLastTransporter(sellerId: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(transporterLastKey(sellerId));
    const name = raw?.trim() || '';
    return name || null;
  } catch {
    return null;
  }
}

/** Push trimmed name to MRU history; optionally remember per-shop last. */
export function rememberTransporter(name: string, sellerId?: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const lower = trimmed.toLowerCase();
  const next = [trimmed, ...listTransporterHistory().filter((row) => row.toLowerCase() !== lower)];
  writeHistory(next);
  if (sellerId != null && sellerId !== '' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(transporterLastKey(sellerId), trimmed);
    } catch {
      // ignore
    }
  }
}

/** Case-insensitive prefix / contains match; empty query → all (newest first). */
export function filterTransporterHistory(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  const all = listTransporterHistory();
  if (!q) return all.slice(0, limit);
  return all.filter((name) => name.toLowerCase().includes(q)).slice(0, limit);
}
