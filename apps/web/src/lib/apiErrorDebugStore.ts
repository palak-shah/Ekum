import type { ApiErrorLogPayload } from './apiErrorLog';

type Listener = (payload: ApiErrorLogPayload | null) => void;

let last: ApiErrorLogPayload | null = null;
const listeners = new Set<Listener>();

/** Last API failure for the debug overlay (null when dismissed / none). */
export function getApiErrorDebug(): ApiErrorLogPayload | null {
  return last;
}

export function setApiErrorDebug(payload: ApiErrorLogPayload | null): void {
  last = payload;
  for (const listener of listeners) listener(last);
}

export function subscribeApiErrorDebug(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function formatApiErrorDebug(payload: ApiErrorLogPayload): string {
  return [
    `${payload.method} ${payload.path} → ${payload.statusCode} ${payload.code}`,
    payload.envelopePath ? `envelopePath: ${payload.envelopePath}` : null,
    `message: ${payload.message}`,
    payload.details != null ? `details: ${JSON.stringify(payload.details, null, 2)}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
