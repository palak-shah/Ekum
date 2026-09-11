/**
 * Media URLs must be absolute http(s) for Zod create schemas. Local/beta often
 * mints relative `/media/…`, `http://localhost:8080/media/…`, or a raw LAN
 * `http://IP:8081/media/…` while the app is on https://beta… — rewrite those
 * same-path media URLs onto the page origin (Nginx serves `/media`).
 * Azure blob URLs (other hosts/paths) are left alone.
 */
export function toAbsoluteMediaUrl(
  url: string,
  origin: string = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '',
): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  // Local voice previews and data URLs must not be rewritten onto the page origin.
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
  try {
    const absolute = new URL(trimmed, origin || 'http://localhost');
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
    return trimmed;
  }
}

function isAppMediaPath(pathname: string): boolean {
  return pathname === '/media' || pathname.startsWith('/media/');
}
