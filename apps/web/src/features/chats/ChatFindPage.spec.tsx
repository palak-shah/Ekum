import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from '@ekum/domain-types';
import { ChatFindPage } from './ChatFindPage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
  },
}));

function renderFind(kind = 'photos') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/chats/find?kind=${kind}`]}>
        <Routes>
          <Route path="/chats" element={<p data-testid="chats-home">Chats home</p>} />
          <Route path="/chats/find" element={<ChatFindPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChatFindPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({
      results: [
        {
          threadId: 't1',
          threadTitle: null,
          counterpartName: 'Ravi Fabrics',
          message: {
            id: 'm1',
            threadId: 't1',
            senderCompanyId: 'c1',
            type: MessageType.Photo,
            body: null,
            reference: null,
            metadata: { urls: ['https://example.com/a.jpg'] },
            createdAt: '2026-09-01T10:00:00.000Z',
            mine: true,
            actor: null,
            replyTo: null,
          },
        },
      ],
      nextCursor: null,
    });
  });

  it('shows Photos pill that clears back to Chats', async () => {
    const user = userEvent.setup();
    renderFind('photos');
    await waitFor(() => {
      expect(screen.getByTestId('chat-find-photo')).toBeInTheDocument();
    });
    expect(api.get).toHaveBeenCalledWith(
      '/threads/messages/find',
      expect.objectContaining({ kind: 'photos', limit: 40 }),
    );
    await user.click(screen.getByRole('button', { name: /Photos/ }));
    expect(screen.getByTestId('chats-home')).toBeInTheDocument();
  });

  it('lists documents as rows', async () => {
    vi.mocked(api.get).mockResolvedValue({
      results: [
        {
          threadId: 't1',
          threadTitle: 'Buyers',
          counterpartName: null,
          message: {
            id: 'm-doc',
            threadId: 't1',
            senderCompanyId: 'c1',
            type: MessageType.Document,
            body: null,
            reference: null,
            metadata: {
              url: 'https://example.com/a.pdf',
              fileName: 'rate-sheet.pdf',
              contentType: 'application/pdf',
            },
            createdAt: '2026-09-01T10:00:00.000Z',
            mine: true,
            actor: null,
            replyTo: null,
          },
        },
      ],
      nextCursor: null,
    });
    renderFind('documents');
    await waitFor(() => {
      expect(screen.getByTestId('chat-find-row')).toBeInTheDocument();
    });
    expect(screen.getByText(/rate-sheet\.pdf/)).toBeInTheDocument();
    expect(screen.getByText('Buyers')).toBeInTheDocument();
  });

  it('opens PhotoViewer on photo tap instead of navigating to chat', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({
      results: [
        {
          threadId: 't1',
          threadTitle: null,
          counterpartName: 'Ravi Fabrics',
          message: {
            id: 'm1',
            threadId: 't1',
            senderCompanyId: 'c1',
            type: MessageType.Photo,
            body: null,
            reference: null,
            metadata: {
              urls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
            },
            createdAt: '2026-09-01T10:00:00.000Z',
            mine: true,
            actor: null,
            replyTo: null,
          },
        },
      ],
      nextCursor: null,
    });
    renderFind('photos');
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-find-photo')).toHaveLength(2);
    });
    await user.click(screen.getAllByTestId('chat-find-photo')[0]!);
    expect(screen.getByTestId('photo-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('photo-viewer-go-chat')).toBeInTheDocument();
    expect(screen.queryByTestId('chats-home')).toBeNull();
  });
});
