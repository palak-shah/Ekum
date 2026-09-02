import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TOKEN_STORAGE_KEY } from './tokenRefresh';

const listeners = new Set<(tokens: unknown) => void>();
let memoryTokens: { accessToken: string; refreshToken: string } | null = null;

vi.mock('./tokenRefresh', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./tokenRefresh')>();
  return {
    ...actual,
    readStoredTokens: () => memoryTokens,
  };
});

beforeEach(() => {
  memoryTokens = null;
  localStorage.clear();
  listeners.clear();
});

describe('setTokens notify', () => {
  it('does not notify listeners when notify is false', async () => {
    const { setTokens, onTokenChange, getTokens } = await import('./apiClient');
    const listener = vi.fn();
    onTokenChange(listener);

    setTokens({ accessToken: 'a1', refreshToken: 'r1' }, { notify: false });
    expect(getTokens()?.accessToken).toBe('a1');
    expect(listener).not.toHaveBeenCalled();

    setTokens({ accessToken: 'a2', refreshToken: 'r2' });
    expect(listener).toHaveBeenCalledOnce();
  });
});
