/**
 * Local media URLs must be absolute http(s) so clients can pass them through
 * Zod `z.string().url()` (Photo Order images). Relative `/media/...` fails create.
 */
export function assertPublicMediaBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      `PUBLIC_MEDIA_BASE_URL must be an absolute http(s) URL (got "${raw}"). Example: https://beta.ekum.app/media`,
    );
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `PUBLIC_MEDIA_BASE_URL must use http or https (got "${raw}"). Example: https://beta.ekum.app/media`,
    );
  }
  // Drop trailing slash from pathname-only bases while keeping origin+path.
  return trimmed;
}
