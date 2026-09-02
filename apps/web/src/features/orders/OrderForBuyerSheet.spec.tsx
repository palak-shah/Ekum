import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderForBuyerSheet } from './OrderForBuyerSheet';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/features/browse/useBrowseShortlist', () => ({
  useBrowseShortlist: () => ({ removeIds: vi.fn() }),
}));

function renderSheet() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrderForBuyerSheet
          open
          onClose={() => {}}
          lines={[{ productId: 'p1', quantity: 10 }]}
          productIds={['p1']}
          onInvite={() => {}}
          onDone={() => {}}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('OrderForBuyerSheet', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/search') return { results: [], nextCursor: null };
      throw new Error(`unexpected ${path}`);
    });
  });

  it('hides Not on Ekum yet until Find on Ekum misses', async () => {
    const user = userEvent.setup();
    renderSheet();

    expect(screen.queryByTestId('order-for-buyer-off-app')).toBeNull();
    expect(screen.getByLabelText('Find on Ekum')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Find on Ekum'), 'ZzNobody');

    await waitFor(() => {
      expect(screen.getByTestId('order-for-buyer-off-app')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Not on Ekum yet' })).toBeInTheDocument();
  });
});
