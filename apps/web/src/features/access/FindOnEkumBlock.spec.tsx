import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FindOnEkumBlock } from './FindOnEkumBlock';
import { api } from '@/lib/apiClient';

const shareOrCopyInvite = vi.hoisted(() => vi.fn(async () => 'copied' as const));

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

vi.mock('@/lib/shareInvite', () => ({
  shareOrCopyInvite,
  inviteShareCopy: () => ({ title: 't', text: 'x' }),
  canNativeShare: () => false,
}));

function renderBlock(onMessage?: (id: string) => void) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <FindOnEkumBlock onSelectConnected={() => {}} onMessage={onMessage} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FindOnEkumBlock', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/search') return { results: [], nextCursor: null };
      throw new Error(`unexpected ${path}`);
    });
  });

  it('shows invite link when a phone-like search finds nobody', async () => {
    const user = userEvent.setup();
    renderBlock();

    await user.type(screen.getByLabelText('Find on Ekum'), '9876543210');

    await waitFor(() => {
      expect(screen.getByText('Not on Ekum yet.')).toBeInTheDocument();
    });
    const invite = screen.getByRole('link', { name: 'Send invite link' });
    expect(invite).toHaveAttribute('href', '/referrals/new');
  });

  it('shows no-match copy for a name miss (not invite)', async () => {
    const user = userEvent.setup();
    renderBlock();

    await user.type(screen.getByLabelText('Find on Ekum'), 'ZzUnknownShop');

    await waitFor(() => {
      expect(screen.getByText(/No match/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: 'Send invite link' })).toBeNull();
  });

  it('reports miss only after a finished empty search', async () => {
    const onMissChange = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <FindOnEkumBlock onSelectConnected={() => {}} onMissChange={onMissChange} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(onMissChange).toHaveBeenCalledWith(false);

    await user.type(screen.getByLabelText('Find on Ekum'), 'ZzNobody');

    await waitFor(() => {
      expect(onMissChange).toHaveBeenCalledWith(true);
    });
  });

  it('shows Request access and Message for a stranger hit', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/search') {
        return {
          results: [
            {
              id: 'co-1',
              name: 'Surat Silk House',
              city: 'Surat',
              verification: 'gst_verified',
              logoUrl: null,
              sellCategories: [],
              buyCategories: [],
            },
          ],
          nextCursor: null,
        };
      }
      throw new Error(`unexpected ${path}`);
    });

    const user = userEvent.setup();
    const onMessage = vi.fn();
    renderBlock(onMessage);

    await user.type(screen.getByLabelText('Find on Ekum'), 'Surat');

    await waitFor(() => {
      expect(screen.getByText('Surat Silk House')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Request access' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Message' }));
    expect(onMessage).toHaveBeenCalledWith('co-1');
  });

  it('link mode waits for tap, omits listed shops, and offers Send invite', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/search') {
        return {
          results: [
            {
              id: 'listed',
              name: 'Already listed',
              city: 'Surat',
              verification: 'none',
              logoUrl: null,
              sellCategories: [],
              buyCategories: [],
            },
            {
              id: 'co-new',
              name: 'Ring Road Silks',
              city: 'Surat',
              verification: 'none',
              logoUrl: null,
              sellCategories: [],
              buyCategories: [],
            },
          ],
          nextCursor: null,
        };
      }
      throw new Error(`unexpected ${path}`);
    });
    vi.mocked(api.post).mockResolvedValue({ token: 'inv-1' });

    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <FindOnEkumBlock
            variant="link"
            inviteAlways
            externalQuery="Surat"
            excludeCompanyIds={['listed']}
            onSelectConnected={() => {}}
            onMessage={() => {}}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.queryByText('Ring Road Silks')).toBeNull();
    await user.click(screen.getByTestId('find-on-ekum-link'));
    await waitFor(() => {
      expect(screen.getByText('Ring Road Silks')).toBeInTheDocument();
    });
    expect(screen.queryByText('Already listed')).toBeNull();
    expect(screen.getByTestId('find-on-ekum-invite')).toHaveTextContent('Send invite');
    await user.click(screen.getByTestId('find-on-ekum-invite'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/referrals', {});
    });
  });
});
