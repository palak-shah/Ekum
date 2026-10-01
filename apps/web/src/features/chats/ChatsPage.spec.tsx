import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatsPage } from './ChatsPage';
import { chatsInboxHref, rememberChatsInbox } from './chatsInboxFilter';
import { requestChatsInboxSelect, setChatsInboxSelecting } from './chatsInboxSelect';
import { resetChatDrafts, setChatDraft } from './chatsDrafts';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/teamCaps', () => ({
  useTeamCaps: () => ({ can: () => true, isOwner: true }),
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function renderPage(path = '/chats') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ChatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChatsPage tabs', () => {
  beforeEach(() => {
    setChatsInboxSelecting(false);
    rememberChatsInbox('all');
  });

  it('does not put ⋯ beside All Chats / Requests', async () => {
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
    renderPage();

    expect(await screen.findByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Requests/ })).toBeInTheDocument();
    expect(screen.queryByTestId('chats-more')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull();
  });

  it('switches All Chats ↔ Requests without flashing a loader or the other list', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path, query) => {
      if (path === '/follows/asks') return [];
      const pending = (query as { state?: string } | undefined)?.state === 'pending';
      return {
        results: [
          {
            id: pending ? 'r1' : 't1',
            type: 'direct',
            visibility: 'trade',
            title: pending ? 'New mill' : 'Surat Silk',
            state: pending ? 'pending' : 'active',
            alertLevel: 'all',
            pinned: false,
            unreadCount: 0,
            lastMessage: null,
            lastMessageAt: new Date().toISOString(),
            counterpart: {
              id: pending ? 'c2' : 'c1',
              name: pending ? 'New mill' : 'Surat Silk',
              logoUrl: null,
            },
            participantCount: 2,
          },
        ],
        nextCursor: null,
      };
    });
    renderPage();

    expect(await screen.findByText('Surat Silk')).toBeInTheDocument();
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/threads',
        expect.objectContaining({ state: 'pending' }),
      ),
    );

    await user.click(screen.getByRole('button', { name: /Requests/ }));
    expect(screen.queryByText('Loading…')).toBeNull();
    expect(screen.queryByText('Surat Silk')).toBeNull();
    expect(screen.getByText('New mill')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^All$/ }));
    expect(screen.queryByText('Loading…')).toBeNull();
    expect(screen.queryByText('New mill')).toBeNull();
    expect(screen.getByText('Surat Silk')).toBeInTheDocument();
  });

  it('opens Requests from ?inbox=requests', async () => {
    vi.mocked(api.get).mockImplementation(async (path, query) => {
      if (path === '/follows/asks') return [];
      const pending = (query as { state?: string } | undefined)?.state === 'pending';
      return {
        results: [
          {
            id: pending ? 'r1' : 't1',
            type: 'direct',
            visibility: 'trade',
            title: pending ? 'New mill' : 'Surat Silk',
            state: pending ? 'pending' : 'active',
            alertLevel: 'all',
            pinned: false,
            unreadCount: 0,
            lastMessage: null,
            lastMessageAt: new Date().toISOString(),
            counterpart: {
              id: pending ? 'c2' : 'c1',
              name: pending ? 'New mill' : 'Surat Silk',
              logoUrl: null,
            },
            participantCount: 2,
          },
        ],
        nextCursor: null,
      };
    });
    renderPage('/chats?inbox=requests');
    expect(await screen.findByText('New mill')).toBeInTheDocument();
    expect(screen.queryByText('Surat Silk')).toBeNull();
  });

  it('remembers Groups so Back from a thread stays on Groups', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path, query) => {
      if (path === '/follows/asks') return [];
      const pending = (query as { state?: string } | undefined)?.state === 'pending';
      return {
        results: pending
          ? []
          : [
              {
                id: 'g1',
                type: 'group',
                visibility: 'trade',
                title: 'Wedding circle',
                state: 'active',
                alertLevel: 'all',
                pinned: false,
                unreadCount: 0,
                lastMessage: null,
                lastMessageAt: new Date().toISOString(),
                counterpart: null,
                participantCount: 3,
              },
            ],
        nextCursor: null,
      };
    });
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Groups/ }));
    expect(chatsInboxHref()).toBe('/chats?inbox=groups');
    expect(await screen.findByText('Wedding circle')).toBeInTheDocument();
  });

  it('shows plain words on See new packs asks', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path, query) => {
      if (path === '/follows/asks') {
        return [
          {
            company: {
              id: 'c-ask',
              name: 'Ahmedabad Loom Co',
              city: 'Ahmedabad',
              logoUrl: null,
              verification: 'none',
            },
            createdAt: '2026-09-24T00:00:00.000Z',
          },
        ];
      }
      const pending = (query as { state?: string } | undefined)?.state === 'pending';
      return { results: pending ? [] : [], nextCursor: null };
    });
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Requests/ }));
    expect(await screen.findByText('Wants to see your new packs')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'They can see my collections' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('checkbox', { name: 'They can share my collections' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Allow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'They can see' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'They can share' })).toBeNull();
  });
});

describe('ChatsPage In chats find', () => {
  beforeEach(() => {
    setChatsInboxSelecting(false);
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
    expect(screen.getByTestId('chats-find-links')).toHaveAttribute('href', '/chats/find?kind=links');
    expect(screen.getByTestId('chats-find-complaints')).toHaveAttribute(
      'href',
      '/chats/find?kind=complaints',
    );
    expect(screen.queryByText('Orders')).toBeNull();
    expect(screen.getByTestId('chats-find-complaints').className).toMatch(/py-2/);
    expect(screen.getByTestId('chats-find-photos').querySelector('.h-10')).toBeTruthy();
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

describe('ChatsPage inbox select', () => {
  const now = new Date().toISOString();

  beforeEach(() => {
    setChatsInboxSelecting(false);
    resetChatDrafts();
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
          unreadCount: 1,
          lastMessage: null,
          lastMessageAt: now,
          counterpart: { id: 'c1', name: 'Surat Silk', logoUrl: null },
          participantCount: 2,
        },
      ],
      nextCursor: null,
    });
  });

  it('reveals More and Archive on a left swipe', async () => {
    renderPage();
    const row = await screen.findByTestId('chats-row-t1');
    Object.defineProperty(row, 'setPointerCapture', { value: vi.fn() });
    fireEvent.pointerDown(row, { clientX: 220, clientY: 40, pointerId: 1 });
    fireEvent.pointerMove(row, { clientX: 80, clientY: 44, pointerId: 1 });
    fireEvent.pointerUp(row, { pointerId: 1 });
    expect(row.style.transform).toBe('translateX(-148px)');
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
  });

  it('selects rows with accent (no checkbox) and archives our shop only', async () => {
    const user = userEvent.setup();
    requestChatsInboxSelect();
    renderPage();

    expect(screen.queryByRole('tab', { name: 'All Chats' })).toBeNull();
    const row = await screen.findByTestId('chats-select-row-t1');
    expect(row.querySelector('input[type="checkbox"]')).toBeNull();
    expect(screen.queryByTestId('chats-inbox-dock')).toBeNull();

    await user.click(row);
    expect(row).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('chats-inbox-dock')).toBeInTheDocument();
    expect(screen.getByTestId('chats-inbox-archive')).toBeInTheDocument();
    expect(screen.getByTestId('chats-inbox-clear')).toBeInTheDocument();
    expect(screen.getByTestId('chats-inbox-delete')).toBeInTheDocument();

    await user.click(screen.getByTestId('chats-inbox-archive'));
    expect(api.post).toHaveBeenCalledWith('/threads/inbox-actions', {
      action: 'archive',
      threadIds: ['t1'],
    });
  });

  it('confirms Clear before posting', async () => {
    const user = userEvent.setup();
    requestChatsInboxSelect();
    renderPage();
    await user.click(await screen.findByTestId('chats-select-row-t1'));
    await user.click(screen.getByTestId('chats-inbox-clear'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Clear chat?' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Clear' }));
    expect(api.post).toHaveBeenCalledWith('/threads/inbox-actions', {
      action: 'clear',
      threadIds: ['t1'],
    });
  });

  it('long-press / right-click opens Pin Mute Archive Clear Delete for our shop', async () => {
    const user = userEvent.setup();
    renderPage();
    const row = await screen.findByTestId('chats-row-t1');
    fireEvent.contextMenu(row);
    expect(screen.getByTestId('chats-row-menu')).toHaveAttribute('role', 'menu');
    expect(screen.queryByRole('heading', { name: 'Surat Silk' })).toBeNull();
    expect(screen.getByTestId('chats-row-pin')).toHaveTextContent('Pin chat');
    expect(screen.getByTestId('chats-row-mute')).toHaveTextContent('Mute');
    expect(screen.queryByTestId('chats-row-unread')).toBeNull();
    expect(screen.getByTestId('chats-row-archive')).toBeInTheDocument();
    expect(screen.getByTestId('chats-row-clear')).toBeInTheDocument();
    expect(screen.getByTestId('chats-row-delete')).toBeInTheDocument();
    expect(screen.queryByTestId('chats-row-exit')).toBeNull();
    expect(screen.queryByText('Lock chat')).toBeNull();
    expect(screen.queryByText('Add to list')).toBeNull();

    await user.click(screen.getByTestId('chats-row-archive'));
    expect(api.post).toHaveBeenCalledWith('/threads/inbox-actions', {
      action: 'archive',
      threadIds: ['t1'],
    });
  });

  it('shows Exit group instead of Delete chat on a group', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({
      results: [
        {
          id: 'g1',
          type: 'group',
          visibility: 'shared',
          title: 'Surat mill group',
          state: 'active',
          alertLevel: 'all',
          pinned: false,
          unreadCount: 0,
          lastMessage: null,
          lastMessageAt: now,
          counterpart: null,
          participantCount: 3,
        },
      ],
      nextCursor: null,
    });
    renderPage();
    fireEvent.contextMenu(await screen.findByTestId('chats-row-g1'));
    expect(screen.getByTestId('chats-row-exit')).toHaveTextContent('Exit group');
    expect(screen.queryByTestId('chats-row-delete')).toBeNull();
    await user.click(screen.getByTestId('chats-row-exit'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Exit this group?' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Exit group' }));
    expect(api.post).toHaveBeenCalledWith('/threads/g1/leave', {});
  });

  it('marks a read chat unread without opening it', async () => {
    const user = userEvent.setup();
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
          lastMessageAt: now,
          counterpart: { id: 'c1', name: 'Surat Silk', logoUrl: null },
          participantCount: 2,
        },
      ],
      nextCursor: null,
    });
    renderPage();
    fireEvent.contextMenu(await screen.findByTestId('chats-row-t1'));
    expect(
      within(screen.getByTestId('chats-row-menu'))
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Pin chat',
      'Mute',
      'Mark as unread',
      'Archive',
      'Clear chat',
      'Delete chat',
      'Block',
    ]);
    await user.click(screen.getByTestId('chats-row-unread'));
    expect(api.post).toHaveBeenCalledWith('/threads/inbox-actions', {
      action: 'unread',
      threadIds: ['t1'],
    });
  });

  it('opens 8 hours / 1 week / Always when muting', async () => {
    const user = userEvent.setup();
    vi.mocked(api.patch).mockResolvedValue({ alertLevel: 'muted' });
    renderPage();
    fireEvent.contextMenu(await screen.findByTestId('chats-row-t1'));
    await user.click(screen.getByTestId('chats-row-mute'));
    expect(screen.getByTestId('chats-row-menu')).toBeInTheDocument();
    expect(screen.getByTestId('chat-mute-flyout')).toBeInTheDocument();
    expect(screen.getByTestId('chat-mute-8h')).toHaveTextContent('8 hours');
    expect(screen.getByTestId('chat-mute-1w')).toHaveTextContent('1 week');
    expect(screen.getByTestId('chat-mute-always')).toHaveTextContent('Always');
    expect(screen.queryByRole('heading', { name: 'Mute' })).not.toBeInTheDocument();
    await user.click(screen.getByTestId('chat-mute-8h'));
    expect(api.patch).toHaveBeenCalledWith('/threads/t1/alert', {
      alertLevel: 'muted',
      muteFor: '8h',
    });
  });

  it('shows Draft: on the row for a half-typed note', async () => {
    setChatDraft('t1', 'ask 40 pcs');
    renderPage();
    expect(await screen.findByText('Draft: ask 40 pcs')).toBeInTheDocument();
  });
});
