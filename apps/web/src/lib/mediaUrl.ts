import { MEDIA_VARIANT, mediaVariantUrl, type MediaVariant } from '@ekum/domain-types';

export type { MediaVariant };
export { MEDIA_VARIANT };

/** Legacy path-bound media tokens (removed Completeness 2026-11-24). Never strip Azure SAS. */
const MEDIA_ACCESS_PARAMS = ['ekum_k', 'ekum_exp', 'ekum_sig'] as const;

/**
 * Drop dead `ekum_*` query params from stored/catalog URLs so thumbs and GET
 * use the plain path. Leaves Azure SAS and other query keys alone.
 */
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

function stripAccessParamsInPlace(parsed: URL): void {
  for (const key of MEDIA_ACCESS_PARAMS) {
    parsed.searchParams.delete(key);
  }
}

/**
 * Media URLs must be absolute http(s) for Zod create schemas. Local/beta often
 * mints relative `/media/…`, `http://localhost:8080/media/…`, or a raw LAN
 * `http://IP:8081/media/…` while the app is on https://beta… — rewrite those
 * same-path media URLs onto the page origin (Nginx serves `/media`).
 * Azure blob URLs (other hosts/paths) are left alone.
 */
export function toAbsoluteMediaUrl(
  url: string | null | undefined,
  origin: string = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '',
): string {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return '';
  // Local voice previews and data URLs must not be rewritten onto the page origin.
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
  try {
    const absolute = new URL(trimmed, origin || 'http://localhost');
    stripAccessParamsInPlace(absolute);
    const path = absolute.pathname + absolute.search + absolute.hash;
    if (!origin || !isAppMediaPath(absolute.pathname)) {
      return absolute.href;
    }
    // App-local media is always served under the public origin `/media`. Rewrite
    // plain http (LAN IP / localhost) to avoid mixed-content on https pages.
    // Leave https Azure (or other) hosts alone even if the path looks like /media/.
    if (
      absolute.protocol === 'http:' ||
      absolute.hostname === 'localhost' ||
      absolute.hostname === '127.0.0.1'
    ) {
      return new URL(path, origin).href;
    }
    return absolute.href;
  } catch {
    return stripMediaAccessParams(trimmed);
  }
}

function isAppMediaPath(pathname: string): boolean {
  return pathname === '/media' || pathname.startsWith('/media/');
}

/**
 * Display URL for a stored original. blob:, data:, and non-managed hosts stay
 * unchanged. Seed catalog rewrites to `seed/thumbnail1|2/{name}.webp`.
 * PhotoViewer must keep `original`.
 */
export function hasMediaAccessToken(url: string): boolean {
  return url.includes('ekum_sig=');
}

export function mediaDisplayUrl(
  url: string | null | undefined,
  variant: MediaVariant = MEDIA_VARIANT.Thumbnail1,
  origin?: string,
): string {
  const absolute =
    origin !== undefined ? toAbsoluteMediaUrl(url, origin) : toAbsoluteMediaUrl(url);
  if (!absolute) return '';
  if (variant === MEDIA_VARIANT.Original) return absolute;
  return mediaVariantUrl(absolute, variant);
}
