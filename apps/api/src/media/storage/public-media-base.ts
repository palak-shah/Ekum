/**
 * Local media URLs must be absolute http(s) so clients can pass them through
 * Zod `z.string().url()`. Relative `/media` is resolved against an origin hint
 * (CORS) or a local docker fallback so a beta misconfig cannot leave the API
 * unhealthy. The web client also rewrites localhost `/media` to the page origin.
 */
export function resolvePublicMediaBaseUrl(
  raw: string,
  options?: { originHint?: string },
): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  const fallbackOrigin = 'http://localhost:8080';

  if (!trimmed) {
    return `${fallbackOrigin}/media`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('bad protocol');
    }
    return trimmed;
  } catch {
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const fromHints = firstHttpOrigin(options?.originHint);
    const origin = (fromHints ?? fallbackOrigin).replace(/\/+$/, '');
    return `${origin}${path}`;
  }
}

function firstHttpOrigin(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  for (const part of raw.split(',')) {
    const candidate = part.trim().replace(/\/+$/, '');
    if (/^https?:\/\//i.test(candidate)) return candidate;
  }
  return undefined;
}

/** @deprecated Use resolvePublicMediaBaseUrl. */
export function assertPublicMediaBaseUrl(raw: string): string {
  return resolvePublicMediaBaseUrl(raw);
}
