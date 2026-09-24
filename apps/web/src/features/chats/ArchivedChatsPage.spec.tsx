import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchivedChatsPage } from './ArchivedChatsPage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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
        <ArchivedChatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ArchivedChatsPage', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockResolvedValue({ ok: true, count: 1 });
    vi.mocked(api.get).mockResolvedValue({
      results: [
        {
          id: 't1',
          type: 'direct',
          visibility: 'trade',
          title: 'Surat Silk',
          state: 'active',
          alertLevel: 'all',
          pinned: false,
          unreadCount: 0,
          lastMessage: null,
          lastMessageAt: new Date().toISOString(),
          counterpart: { id: 'c1', name: 'Surat Silk', logoUrl: null },
          participantCount: 2,
        },
      ],
      nextCursor: null,
    });
  });

  it('lists hidden chats and unarchives from the row menu', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('Surat Silk')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(
      '/threads',
      expect.objectContaining({ inbox: 'hidden', state: 'active' }),
    );
    fireEvent.contextMenu(screen.getByTestId('chats-row-t1'));
    expect(screen.getByTestId('chats-row-unarchive')).toHaveTextContent('Unarchive');
    expect(screen.getByTestId('chats-row-unread')).toHaveTextContent('Mark as unread');
    await user.click(screen.getByTestId('chats-row-unarchive'));
    expect(api.post).toHaveBeenCalledWith('/threads/inbox-actions', {
      action: 'unarchive',
      threadIds: ['t1'],
    });
  });
});
