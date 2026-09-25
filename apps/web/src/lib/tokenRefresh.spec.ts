import { describe, expect, it, vi } from 'vitest';
import {
  REFRESH_LOCK_KEY,
  TOKEN_STORAGE_KEY,
  isDefinitiveAuthFailure,
  refreshAuthTokens,
  requestPersistentAuthStorage,
  tryAcquireLocalRefreshLock,
} from './tokenRefresh';

describe('requestPersistentAuthStorage', () => {
  it('asks the browser to keep the login store', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    const persisted = vi.fn().mockResolvedValue(false);
    await expect(requestPersistentAuthStorage({ persist, persisted })).resolves.toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });
});

describe('isDefinitiveAuthFailure', () => {
  it('treats INVALID_TOKEN 401 as hard auth failure', () => {
    expect(isDefinitiveAuthFailure(401, 'INVALID_TOKEN')).toBe(true);
  });

  it('does not treat 5xx as auth failure', () => {
    expect(isDefinitiveAuthFailure(503, 'UNKNOWN')).toBe(false);
  });
});

describe('tryAcquireLocalRefreshLock', () => {
  it('blocks a second acquirer until lock expires', () => {
    localStorage.removeItem(REFRESH_LOCK_KEY);
    expect(tryAcquireLocalRefreshLock(1_000)).toBe(true);
    expect(tryAcquireLocalRefreshLock(1_000)).toBe(false);
    expect(tryAcquireLocalRefreshLock(20_000)).toBe(true);
    localStorage.removeItem(REFRESH_LOCK_KEY);
  });
});

describe('refreshAuthTokens', () => {
  it('keeps tokens on transient refresh failure', async () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_LOCK_KEY);
    const tokens = { accessToken: 'a', refreshToken: 'r' };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));

    const fetchRefresh = vi.fn(async () => ({
      ok: false,
      status: 503,
      code: 'UNKNOWN',
    }));

    const result = await refreshAuthTokens(tokens, fetchRefresh);
    expect(result.cleared).toBe(false);
    expect(result.tokens).toEqual(tokens);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).not.toBeNull();
  });

  it('clears tokens on INVALID_TOKEN', async () => {
    localStorage.removeItem(REFRESH_LOCK_KEY);
    const tokens = { accessToken: 'a', refreshToken: 'r' };

    const result = await refreshAuthTokens(tokens, async () => ({
      ok: false,
      status: 401,
      code: 'INVALID_TOKEN',
    }));

    expect(result.cleared).toBe(true);
    expect(result.tokens).toBeNull();
  });
});
