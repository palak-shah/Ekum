/**
 * Media URL helpers for catalog responses.
 * Plain stored `/media/…` strings — no path-bound signatures (Completeness 2026-11-24).
 * Legacy `ekum_*` query params from the old signer are stripped on read.
 */

export type MediaAccessKind = 'preview' | 'full';

const MEDIA_ACCESS_PARAMS = ['ekum_k', 'ekum_exp', 'ekum_sig'] as const;

/** Drop dead ekum_* tokens; never touch Azure SAS keys. */
export function stripMediaAccessParams(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes('ekum_')) return trimmed;
  try {
    const relative = trimmed.startsWith('/');
    const parsed = relative ? new URL(trimmed, 'http://localhost') : new URL(trimmed);
    let changed = false;
    for (const key of MEDIA_ACCESS_PARAMS) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.delete(key);
        changed = true;
      }
    }
    if (!changed) return trimmed;
    if (relative) {
      const q = parsed.searchParams.toString();
      return q ? `${parsed.pathname}?${q}${parsed.hash}` : `${parsed.pathname}${parsed.hash}`;
    }
    return parsed.href;
  } catch {
    return trimmed;
  }
}

/** Pass-through (plus strip legacy tokens). Access kind no longer rewrites variants. */
export function mediaUrlForViewer(
  url: string,
  _access: MediaAccessKind,
): string {
  return stripMediaAccessParams(url);
}

export function mapMediaUrlsForViewer(
  urls: string[] | null | undefined,
  access: MediaAccessKind,
): string[] {
  if (!urls?.length) return [];
  return urls.map((url) => mediaUrlForViewer(url, access));
}
