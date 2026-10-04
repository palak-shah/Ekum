import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StarredMessagesPage } from './StarredMessagesPage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    del: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StarredMessagesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StarredMessagesPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({
      results: [
        {
          threadId: 't1',
          threadTitle: 'Surat Silk',
          counterpartName: 'Surat Silk',
          starredAt: new Date().toISOString(),
          message: {
            id: 'm1',
            type: 'text',
            body: 'Rate 120',
            createdAt: new Date().toISOString(),
          },
        },
      ],
      nextCursor: null,
    });
    vi.mocked(api.del).mockResolvedValue({ ok: true });
  });

  it('shows cards with Unstar without opening the thread', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByTestId('starred-row-m1')).toHaveAttribute(
      'href',
      '/chats/t1?message=m1',
    );
    expect(screen.getByText('Surat Silk')).toBeInTheDocument();
    expect(screen.getByText('Rate 120')).toBeInTheDocument();
    await user.click(screen.getByTestId('starred-unstar-m1'));
    expect(api.del).toHaveBeenCalledWith('/messages/m1/star');
  });
});
