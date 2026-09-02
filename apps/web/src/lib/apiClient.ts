import type { AuthSession, AuthTokens, ErrorEnvelope } from '@ekum/domain-types';
import {
  TOKEN_STORAGE_KEY,
  isDefinitiveAuthFailure,
  readStoredTokens,
  refreshAuthTokens,
} from './tokenRefresh';

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v1';

/**
 * A typed error carrying the server's ErrorEnvelope. UI shows `message`; code is
 * used to branch on specific conditions (e.g. CONNECTION_REQUIRED gates a screen).
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: unknown;

  constructor(envelope: Pick<ErrorEnvelope, 'statusCode' | 'code' | 'message' | 'details'>) {
    super(envelope.message);
    this.name = 'ApiError';
    this.statusCode = envelope.statusCode;
    this.code = envelope.code;
    this.details = envelope.details;
  }
}

let tokens: AuthTokens | null = readStoredTokens();
const listeners = new Set<(tokens: AuthTokens | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== TOKEN_STORAGE_KEY) return;
    if (event.newValue) {
      try {
        tokens = JSON.parse(event.newValue) as AuthTokens;
      } catch {
        tokens = null;
      }
    } else {
      tokens = null;
    }
    for (const listener of listeners) {
      listener(tokens);
    }
  });
}

export function getTokens(): AuthTokens | null {
  return tokens;
}

export function setTokens(
  next: AuthTokens | null,
  options?: { notify?: boolean },
): void {
  tokens = next;
  try {
    if (next) {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable (private mode); the in-memory copy still works.
  }
  if (options?.notify !== false) {
    for (const listener of listeners) {
      listener(next);
    }
  }
}

/** Notifies subscribers whenever tokens change (e.g. logout triggered by a 401). */
export function onTokenChange(listener: (tokens: AuthTokens | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  auth?: boolean;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

let refreshInFlight: Promise<AuthSession | null> | null = null;

async function fetchRefreshSession(refreshToken: string): Promise<{
  ok: boolean;
  status: number;
  code?: string;
  session?: AuthSession;
}> {
  try {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (response.ok) {
      const session = (await response.json()) as AuthSession;
      return { ok: true, status: response.status, session };
    }
    let code: string | undefined;
    try {
      const envelope = (await response.json()) as Partial<ErrorEnvelope>;
      code = envelope.code;
    } catch {
      // ignore parse errors
    }
    return { ok: false, status: response.status, code };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK' };
  }
}

/** Single-flight, cross-tab-safe refresh. Clears tokens only on definitive auth failure. */
export async function performTokenRefresh(): Promise<AuthSession | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const result = await refreshAuthTokens(tokens, fetchRefreshSession);
      if (result.cleared) {
        setTokens(null);
        return null;
      }
      if (result.session) {
        setTokens(result.session.tokens, { notify: false });
        return result.session;
      }
      if (result.tokens) {
        setTokens(result.tokens, { notify: false });
      }
      return null;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function refreshTokens(): Promise<AuthTokens | null> {
  const session = await performTokenRefresh();
  return session?.tokens ?? null;
}

async function parseError(response: Response): Promise<ApiError> {
  let envelope: Partial<ErrorEnvelope> = {};
  try {
    envelope = (await response.json()) as Partial<ErrorEnvelope>;
  } catch {
    // Non-JSON error body; fall back to the status text.
  }
  return new ApiError({
    statusCode: envelope.statusCode ?? response.status,
    code: envelope.code ?? 'UNKNOWN',
    message: envelope.message ?? response.statusText ?? 'Something went wrong.',
    details: envelope.details,
  });
}

async function execute<T>(
  method: string,
  path: string,
  options: RequestOptions,
  retryOn401: boolean,
): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (options.auth !== false && tokens?.accessToken) {
    headers.authorization = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (response.status === 401 && retryOn401 && options.auth !== false) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return execute<T>(method, path, options, false);
    }
    if (!getTokens()?.refreshToken) {
      throw await parseError(response);
    }
    throw new ApiError({
      statusCode: 503,
      code: 'SESSION_REFRESH_PENDING',
      message: 'Could not reach Ekum to refresh your session. Try again.',
    });
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => execute<T>('GET', path, { query }, true),
  post: <T>(path: string, body?: unknown, query?: Query) =>
    execute<T>('POST', path, { body, query }, true),
  put: <T>(path: string, body?: unknown) => execute<T>('PUT', path, { body }, true),
  patch: <T>(path: string, body?: unknown) => execute<T>('PATCH', path, { body }, true),
  del: <T>(path: string, body?: unknown) => execute<T>('DELETE', path, { body }, true),
  /** Public (unauthenticated) POST — used for OTP request/verify. */
  publicPost: <T>(path: string, body?: unknown) =>
    execute<T>('POST', path, { body, auth: false }, false),
  publicGet: <T>(path: string, query?: Query) =>
    execute<T>('GET', path, { query, auth: false }, false),
};

export { isDefinitiveAuthFailure };
