/**
 * Public site origin for OG / share cards.
 * Prefer https so messengers (WhatsApp) accept og:image / og:url.
 * Falls back to the first http(s) CORS origin when no https entry exists.
 */
export function resolvePublicWebOrigin(corsOrigins: string): string {
  const parts = corsOrigins
    .split(',')
    .map((part) => part.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const https = parts.find((origin) => /^https:\/\//i.test(origin));
  if (https) return https;

  const http = parts.find((origin) => /^https?:\/\//i.test(origin));
  if (http) return http;

  return 'http://localhost:8080';
}
