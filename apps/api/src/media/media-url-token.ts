/**
 * Path-bound short-lived signatures for local `/media/…` GETs.
 * Stealing a token for path A cannot open path B.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  MEDIA_VARIANT,
  mediaVariantUrl,
  parseManagedMediaUrl,
} from '@ekum/domain-types';

export type MediaAccessKind = 'preview' | 'full';

const DEFAULT_TTL_MS = 45 * 60_000;

function mediaSigningSecret(): string {
  return (
    process.env.MEDIA_URL_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    'ekum-dev-media-secret'
  );
}

function signPayload(pathname: string, kind: MediaAccessKind, exp: number): string {
  return createHmac('sha256', mediaSigningSecret())
    .update(`${kind}:${exp}:${pathname}`)
    .digest('base64url');
}

export function isMediaImagePath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return (
    lower.includes('/original/') ||
    lower.includes('/thumbnail1/') ||
    lower.includes('/thumbnail2/') ||
    /\.(jpe?g|png|webp)$/i.test(lower)
  );
}

/** Paths that a preview token may open (not original / not thumb2). */
export function pathAllowedForPreview(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (lower.includes('/original/')) return false;
  if (lower.includes('/thumbnail2/')) return false;
  return true;
}

export function signMediaUrl(
  url: string,
  kind: MediaAccessKind,
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  const relative = trimmed.startsWith('/');
  let parsed: URL;
  try {
    parsed = relative ? new URL(trimmed, 'http://localhost') : new URL(trimmed);
  } catch {
    return trimmed;
  }
  if (!parsed.pathname.startsWith('/media')) {
    return trimmed;
  }
  if (parsed.searchParams.has('ekum_sig')) {
    return trimmed;
  }
  const exp = Math.floor((Date.now() + ttlMs) / 1000);
  const sig = signPayload(parsed.pathname, kind, exp);
  parsed.searchParams.set('ekum_k', kind);
  parsed.searchParams.set('ekum_exp', String(exp));
  parsed.searchParams.set('ekum_sig', sig);
  if (relative) {
    return `${parsed.pathname}?${parsed.searchParams.toString()}`;
  }
  return parsed.href;
}

export function verifyMediaUrlToken(input: {
  pathname: string;
  kind: string | null;
  exp: string | null;
  sig: string | null;
}): boolean {
  if (!input.kind || !input.exp || !input.sig) return false;
  if (input.kind !== 'preview' && input.kind !== 'full') return false;
  const exp = Number(input.exp);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  if (input.kind === 'preview' && !pathAllowedForPreview(input.pathname)) return false;
  const expected = signPayload(input.pathname, input.kind, exp);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(input.sig);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Locked visitor → thumbnail1 + preview token.
 * Owner / allowDownload → keep URL tier + full token.
 */
export function mediaUrlForViewer(
  url: string,
  access: 'preview' | 'full',
): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (access === 'full') {
    return signMediaUrl(trimmed, 'full');
  }
  const preview = mediaVariantUrl(trimmed, MEDIA_VARIANT.Thumbnail1) || trimmed;
  // If variant rewrite failed, still try to avoid original in the string.
  const parsed = parseManagedMediaUrl(preview);
  const safe =
    parsed && (parsed.blobPath.includes('/original/') || parsed.blobPath.includes('/thumbnail2/'))
      ? mediaVariantUrl(trimmed, MEDIA_VARIANT.Thumbnail1) || preview
      : preview;
  return signMediaUrl(safe, 'preview');
}

export function mapMediaUrlsForViewer(
  urls: string[] | null | undefined,
  access: 'preview' | 'full',
): string[] {
  if (!urls?.length) return [];
  return urls.map((url) => mediaUrlForViewer(url, access));
}
