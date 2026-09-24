import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatsHeaderMore } from './ChatsHeaderMore';
import { setChatsInboxSelecting } from './chatsInboxSelect';
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

vi.mock('@/lib/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/queries')>();
  return {
    ...actual,
    useMyCompany: () => ({ data: { id: 'me', name: 'Jaipur Emporium' } }),
    useChatUnreadCount: () => ({ data: { count: 2 } }),
  };
});

function renderMore() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ChatsHeaderMore />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChatsHeaderMore', () => {
  beforeEach(() => {
    setChatsInboxSelecting(false);
    vi.mocked(api.get).mockResolvedValue({ count: 2 });
    vi.mocked(api.post).mockResolvedValue({ ok: true });
  });

  it('keeps Mark all read behind header ⋯', async () => {
    const user = userEvent.setup();
    renderMore();
    expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull();
    await user.click(screen.getByTestId('chats-more'));
    expect(screen.getByTestId('chats-more-menu')).toHaveAttribute('role', 'menu');
    expect(screen.queryByRole('heading', { name: 'Chats' })).toBeNull();
    expect(screen.getByTestId('chats-starred')).toBeInTheDocument();
    expect(screen.getByTestId('chats-archived')).toBeInTheDocument();
    expect(screen.getByTestId('chats-mark-all-read')).toBeInTheDocument();
    expect(screen.getByTestId('chats-invite-connect')).toHaveTextContent('Invite to connect');
    await user.click(screen.getByTestId('chats-mark-all-read'));
    expect(api.post).toHaveBeenCalledWith('/threads/read-all', {});
  });

  it('offers Select chats next to Mark all read, then Cancel', async () => {
    const user = userEvent.setup();
    renderMore();
    await user.click(screen.getByTestId('chats-more'));
    await user.click(screen.getByTestId('chats-select'));
    expect(screen.getByTestId('chats-select-cancel')).toBeInTheDocument();
    expect(screen.queryByTestId('chats-more')).toBeNull();
    await user.click(screen.getByTestId('chats-select-cancel'));
    expect(screen.getByTestId('chats-more')).toBeInTheDocument();
  });
});
