/**
 * Media paths must be absolute http(s) for Zod create schemas (Save to my designs,
 * Photo Order, etc.). Chat thumbs often store relative `/media/…` or localhost
 * seed URLs — rewrite those onto the public media origin.
 */
import { resolvePublicMediaBaseUrl } from './storage/public-media-base';

export function originFromPublicMediaBase(mediaBase: string): string {
  const base = resolvePublicMediaBaseUrl(mediaBase);
  try {
    return new URL(base).origin;
  } catch {
    return 'http://localhost:8080';
  }
}

export function absolutizeMediaUrl(
  url: string,
  origin: string,
): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
  try {
    const absolute = new URL(trimmed, origin || 'http://localhost');
    const path = absolute.pathname + absolute.search + absolute.hash;
    if (!origin || !isAppMediaPath(absolute.pathname)) {
      return absolute.href;
    }
    if (
      absolute.protocol === 'http:' ||
      absolute.hostname === 'localhost' ||
      absolute.hostname === '127.0.0.1'
    ) {
      return new URL(path, origin).href;
    }
    return absolute.href;
  } catch {
    return trimmed;
  }
}

function isAppMediaPath(pathname: string): boolean {
  return pathname === '/media' || pathname.startsWith('/media/');
}

/** Rewrite `images` (and optional cover) on product create/update bodies. */
export function absolutizeProductImageFields(
  body: unknown,
  mediaBase: string,
): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const origin = originFromPublicMediaBase(mediaBase);
  const next = { ...(body as Record<string, unknown>) };
  if (Array.isArray(next.images)) {
    next.images = next.images.map((entry) =>
      typeof entry === 'string' ? absolutizeMediaUrl(entry, origin) : entry,
    );
  }
  if (typeof next.coverImage === 'string') {
    next.coverImage = absolutizeMediaUrl(next.coverImage, origin);
  }
  return next;
}
