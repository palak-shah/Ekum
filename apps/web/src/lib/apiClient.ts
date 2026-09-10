import type { AuthSession, AuthTokens, ErrorEnvelope } from '@ekum/domain-types';
import {
  TOKEN_STORAGE_KEY,
  isDefinitiveAuthFailure,
  readStoredTokens,
  refreshAuthTokens,
} from './tokenRefresh';
import { buildApiErrorLog, logApiError, shouldLogApiError } from './apiErrorLog';

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v1';

/**
 * Join API base + path into an absolute URL. Relative bases (Docker same-origin
 * `/api/v1`) need an origin — `new URL('/api/v1/…')` alone throws Invalid URL.
 */
export function joinApiUrl(
  baseUrl: string,
  path: string,
  origin: string = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost',
): string {
  const base = baseUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return new URL(`${base}${suffix}`, origin).toString();
}

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
  const url = new URL(joinApiUrl(BASE_URL, path));
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

async function parseError(
  response: Response,
  ctx: { method: string; path: string; log: boolean },
): Promise<ApiError> {
  let envelope: Partial<ErrorEnvelope> = {};
  try {
    envelope = (await response.json()) as Partial<ErrorEnvelope>;
  } catch {
    // Non-JSON error body; fall back to the status text.
  }
  const raw = (envelope.message ?? response.statusText ?? '').trim();
  // Never toast SCREAMING_SNAKE codes or old opaque validation copy — traders need a sentence.
  const looksLikeCode = /^[A-Z][A-Z0-9_]{2,}$/.test(raw);
  const opaqueValidation = /^the request could not be processed\.?$/i.test(raw);
  const message =
    !raw || looksLikeCode || opaqueValidation
      ? 'Something doesn’t look right. Check what you entered and try again.'
      : raw;
  const error = new ApiError({
    statusCode: envelope.statusCode ?? response.status,
    code: envelope.code ?? 'UNKNOWN',
    message,
    details: envelope.details,
  });
  if (ctx.log) {
    logApiError(
      buildApiErrorLog({
        method: ctx.method,
        path: ctx.path,
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
        details: error.details,
        envelopePath: typeof envelope.path === 'string' ? envelope.path : undefined,
      }),
    );
  }
  return error;
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

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    const error = new ApiError({
      statusCode: 0,
      code: 'NETWORK',
      message: 'Could not reach Ekum. Check your connection and try again.',
      details: null,
    });
    logApiError(
      buildApiErrorLog({
        method,
        path,
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
        details: error.details,
      }),
    );
    throw error;
  }

  const willRetryAuth = response.status === 401 && retryOn401 && options.auth !== false;
  if (willRetryAuth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return execute<T>(method, path, options, false);
    }
    if (!getTokens()?.refreshToken) {
      throw await parseError(response, { method, path, log: true });
    }
    const pending = new ApiError({
      statusCode: 503,
      code: 'SESSION_REFRESH_PENDING',
      message: 'Could not reach Ekum to refresh your session. Try again.',
      details: null,
    });
    logApiError(
      buildApiErrorLog({
        method,
        path,
        statusCode: pending.statusCode,
        code: pending.code,
        message: pending.message,
        details: pending.details,
      }),
    );
    throw pending;
  }

  if (!response.ok) {
    throw await parseError(response, {
      method,
      path,
      log: shouldLogApiError({ statusCode: response.status, willRetryAuth: false }),
    });
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
