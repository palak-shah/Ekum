import type { AuthSession, AuthTokens } from '@ekum/domain-types';

export const TOKEN_STORAGE_KEY = 'ekum.tokens';
export const REFRESH_LOCK_KEY = 'ekum.refresh.lock';
export const REFRESH_LOCK_MS = 15_000;

export function isDefinitiveAuthFailure(status: number, code?: string): boolean {
  return status === 401 && (code === 'INVALID_TOKEN' || code === 'UNAUTHORIZED');
}

export function readStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readRefreshLockUntil(): number | null {
  try {
    const raw = localStorage.getItem(REFRESH_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { until?: number };
    return typeof parsed.until === 'number' ? parsed.until : null;
  } catch {
    return null;
  }
}

export function tryAcquireLocalRefreshLock(now = Date.now()): boolean {
  const until = readRefreshLockUntil();
  if (until != null && until > now) {
    return false;
  }
  localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ until: now + REFRESH_LOCK_MS }));
  return true;
}

export function releaseLocalRefreshLock(): void {
  localStorage.removeItem(REFRESH_LOCK_KEY);
}

/** Wait for another tab to finish refresh and write rotated tokens. */
export async function waitForCrossTabTokens(
  refreshTokenBefore: string,
  timeoutMs = REFRESH_LOCK_MS,
): Promise<AuthTokens | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const stored = readStoredTokens();
    if (!stored?.refreshToken) {
      return null;
    }
    if (stored.refreshToken !== refreshTokenBefore) {
      return stored;
    }
    const lockUntil = readRefreshLockUntil();
    if (lockUntil == null || lockUntil <= Date.now()) {
      return readStoredTokens();
    }
    await sleep(80);
  }
  return readStoredTokens();
}

export async function withCrossTabRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('ekum-auth-refresh', { mode: 'exclusive' }, run);
  }

  const refreshTokenBefore = readStoredTokens()?.refreshToken ?? '';
  if (!tryAcquireLocalRefreshLock()) {
    await waitForCrossTabTokens(refreshTokenBefore);
    if (!tryAcquireLocalRefreshLock()) {
      await sleep(200);
      tryAcquireLocalRefreshLock();
    }
  }

  try {
    return await run();
  } finally {
    releaseLocalRefreshLock();
  }
}

export type RefreshFetcher = (refreshToken: string) => Promise<{
  ok: boolean;
  status: number;
  code?: string;
  session?: AuthSession;
}>;

/** Locked refresh: clears tokens only on definitive auth failure. */
export async function refreshAuthTokens(
  current: AuthTokens | null,
  fetchRefresh: RefreshFetcher,
): Promise<{ tokens: AuthTokens | null; session: AuthSession | null; cleared: boolean }> {
  const refreshToken = current?.refreshToken ?? readStoredTokens()?.refreshToken;
  if (!refreshToken) {
    return { tokens: null, session: null, cleared: false };
  }

  return withCrossTabRefreshLock(async () => {
    const stored = readStoredTokens();
    const activeRefresh = stored?.refreshToken ?? refreshToken;
    if (!activeRefresh) {
      return { tokens: null, session: null, cleared: false };
    }

    if (stored?.refreshToken && stored.refreshToken !== refreshToken) {
      return { tokens: stored, session: null, cleared: false };
    }

    const result = await fetchRefresh(activeRefresh);
    if (result.ok && result.session) {
      return { tokens: result.session.tokens, session: result.session, cleared: false };
    }

    if (isDefinitiveAuthFailure(result.status, result.code)) {
      return { tokens: null, session: null, cleared: true };
    }

    return { tokens: stored ?? current, session: null, cleared: false };
  });
}
