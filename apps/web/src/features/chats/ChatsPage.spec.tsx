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

describe('ChatsPage Mark all read', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockResolvedValue({ ok: true });
  });

  it('keeps Mark all read in ⋯ menu, not beside All Chats / Requests tabs', async () => {
    vi.mocked(api.get).mockResolvedValue({
      results: [
        {
          id: 't1',
          kind: 'direct',
          title: 'Surat Silk',
          unreadCount: 2,
          pinned: false,
          updatedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          lastPreview: 'Hi',
          counterpartCompanyId: 'c1',
          counterpartCompanyName: 'Surat Silk',
          counterpartLogoUrl: null,
        },
      ],
      nextCursor: null,
    });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('tab', { name: 'All Chats' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Requests Received' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull();

    await user.click(await screen.findByTestId('chats-more'));
    expect(screen.getByTestId('chats-mark-all-read')).toBeInTheDocument();
    await user.click(screen.getByTestId('chats-mark-all-read'));
    expect(api.post).toHaveBeenCalledWith('/threads/read-all', {});
  });
});

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
