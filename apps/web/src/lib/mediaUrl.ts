/**
 * Media URLs must be absolute http(s) for Zod create schemas (designs, photo
 * orders, collection covers). Local/beta often mints relative `/media/…` or
 * `http://localhost:8080/media/…` — rewrite to the page origin.
 */
export function toAbsoluteMediaUrl(
  url: string,
  origin: string = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '',
): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  try {
    const absolute = new URL(trimmed, origin || 'http://localhost');
    const path = absolute.pathname + absolute.search + absolute.hash;
    if (
      origin &&
      path.startsWith('/media/') &&
      (absolute.hostname === 'localhost' || absolute.hostname === '127.0.0.1')
    ) {
      return new URL(path, origin).href;
    }
    return absolute.href;
  } catch {
    return trimmed;
  }
}
