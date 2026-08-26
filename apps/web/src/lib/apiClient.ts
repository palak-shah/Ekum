import type { AuthTokens, ErrorEnvelope } from '@ekum/domain-types';

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v1';

const TOKEN_STORAGE_KEY = 'ekum.tokens';

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

function readStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

export function getTokens(): AuthTokens | null {
  return tokens;
}

export function setTokens(next: AuthTokens | null): void {
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
  for (const listener of listeners) {
    listener(next);
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

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  if (!tokens?.refreshToken) {
    return null;
  }
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens?.refreshToken }),
        });
        if (!response.ok) {
          setTokens(null);
          return null;
        }
        const session = (await response.json()) as { tokens: AuthTokens };
        setTokens(session.tokens);
        return session.tokens;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
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
