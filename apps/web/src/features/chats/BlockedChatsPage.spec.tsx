import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlockedChatsPage } from './BlockedChatsPage';
import { api } from '@/lib/apiClient';
import { UNBLOCK_ACCESS_CLEARED_TOAST } from '@/features/company/seePacksCopy';

const showToast = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast }),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BlockedChatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BlockedChatsPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockResolvedValue([
      {
        id: 'conn-blocked',
        company: {
          id: 'c-b',
          name: 'Blocked Mill',
          city: 'Surat',
          logoUrl: null,
          verification: 'none',
        },
        status: 'blocked',
        createdAt: '2026-11-14T00:00:00.000Z',
        canPause: false,
        canResume: false,
        canBlock: false,
        canUnblock: true,
      },
      {
        id: 'conn-active',
        company: {
          id: 'c-a',
          name: 'Active Shop',
          city: 'Surat',
          logoUrl: null,
          verification: 'none',
        },
        status: 'active',
        createdAt: '2026-11-14T00:00:00.000Z',
        canPause: false,
        canResume: false,
        canBlock: true,
        canUnblock: false,
      },
    ]);
    vi.mocked(api.post).mockResolvedValue({});
  });

  it('lists only shops you can Unblock and toasts on Unblock', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Blocked' })).toBeInTheDocument();
    expect(screen.getByText('Blocked Mill')).toBeInTheDocument();
    expect(screen.queryByText('Active Shop')).toBeNull();
    await user.click(screen.getByTestId('blocked-unblock-conn-blocked'));
    expect(api.post).toHaveBeenCalledWith('/connections/conn-blocked/unblock', {});
    expect(showToast).toHaveBeenCalledWith(UNBLOCK_ACCESS_CLEARED_TOAST);
  });
});
