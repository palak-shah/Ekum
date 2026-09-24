import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/app/queryClient';
import { api, getTokens, setTokens } from './apiClient';
import { AuthProvider, useAuth } from './auth';
import { TOKEN_STORAGE_KEY } from './tokenRefresh';

function LogoutProbe() {
  const { logout, status } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{status}</span>
      <button type="button" onClick={() => void logout()}>
        Log out
      </button>
    </div>
  );
}

const me = {
  user: {
    userId: 'u1',
    phone: '+919800000001',
    name: 'Ravi',
    companyId: 'c1',
  },
  needsOnboarding: false,
};

describe('logout', () => {
  beforeEach(() => {
    queryClient.clear();
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it('drops the local session before the server revoke finishes', async () => {
    setTokens({ accessToken: 'a', refreshToken: 'r' }, { notify: false });
    vi.spyOn(api, 'get').mockResolvedValue(me as never);

    vi.spyOn(api, 'publicPost').mockImplementation(
      () =>
        new Promise(() => {
          /* hang — revoke still in flight */
        }) as Promise<never>,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LogoutProbe />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('anonymous');
    });
    expect(getTokens()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(api.publicPost).toHaveBeenCalled();
  });
});
