import { afterEach, describe, expect, it, vi } from 'vitest';
import { TOKEN_STORAGE_KEY } from './tokenRefresh';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.removeItem(TOKEN_STORAGE_KEY);
});

describe('performTokenRefresh vs Logout', () => {
  it('does not write rotated tokens after the device has signed out', async () => {
    const { setTokens, getTokens, clearSessionTokens, performTokenRefresh } = await import(
      './apiClient'
    );

    setTokens({ accessToken: 'old-access', refreshToken: 'old-refresh' }, { notify: false });

    let release!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            release = resolve;
          }),
      ),
    );

    const pending = performTokenRefresh();
    clearSessionTokens();
    expect(getTokens()).toBeNull();

    release(
      new Response(
        JSON.stringify({
          tokens: { accessToken: 'new-access', refreshToken: 'new-refresh' },
          user: { id: 'u1', phone: '+919800000001' },
          needsOnboarding: false,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await pending;
    expect(getTokens()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
