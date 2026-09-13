import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatsPage } from './ChatsPage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/teamCaps', () => ({
  useTeamCaps: () => ({ can: () => true, isOwner: true }),
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ChatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChatsPage In chats find', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ results: [], nextCursor: null });
  });

  it('shows In chats shortcuts when search is focused empty', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.queryByTestId('chats-in-chats')).toBeNull();

    await user.click(screen.getByTestId('chats-search'));
    expect(screen.getByTestId('chats-in-chats')).toBeInTheDocument();
    expect(screen.getByTestId('chats-find-photos')).toHaveAttribute(
      'href',
      '/chats/find?kind=photos',
    );
    expect(screen.getByTestId('chats-find-documents')).toBeInTheDocument();
    expect(screen.getByTestId('chats-find-collections')).toBeInTheDocument();
    expect(screen.getByTestId('chats-find-designs')).toBeInTheDocument();
    expect(screen.queryByText('Orders')).toBeNull();
  });

  it('hides In chats when typing a query', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('chats-search'));
    expect(screen.getByTestId('chats-in-chats')).toBeInTheDocument();
    await user.type(screen.getByTestId('chats-search'), 'Meena');
    expect(screen.queryByTestId('chats-in-chats')).toBeNull();
  });
});
