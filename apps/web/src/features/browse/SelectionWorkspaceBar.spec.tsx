import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageType } from '@ekum/domain-types';
import { ToastProvider } from '@/ui/Toast';
import { api } from '@/lib/apiClient';
import { SELECTION_FLOATER_MIN_H, SelectionWorkspaceBar } from './SelectionWorkspaceBar';

const navigate = vi.fn();
const addStagingToCart = vi.fn(() => ({ added: 1 }));
const setSelectModeShortlist = vi.fn();
const setSelectModeAlbum = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

const shortlistCompanyId = vi.hoisted(() => ({ current: 'c1' as string }));

vi.mock('@/features/browse/useBrowseShortlist', () => ({
  useBrowseShortlist: () => ({
    count: 1,
    entries: [
      {
        productId: 'p1',
        name: 'Navy',
        thumbUrl: null,
        companyId: shortlistCompanyId.current,
        companyName: shortlistCompanyId.current === 'me' ? 'My shop' : 'Mill',
      },
    ],
    setSelectMode: setSelectModeShortlist,
  }),
}));

vi.mock('@/features/browse/useBrowseAlbumPick', () => ({
  useBrowseAlbumPick: () => ({
    count: 0,
    entries: [],
    setSelectMode: setSelectModeAlbum,
  }),
}));

vi.mock('@/features/browse/addStagingToCart', () => ({
  addStagingToCart: () => addStagingToCart(),
}));

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me' } }),
}));

vi.mock('@/features/browse/prefetchSelectionPage', () => ({
  prefetchSelectionPage: vi.fn(),
}));

vi.mock('@/features/browse/resumeAfterAlbumPick', () => ({
  readResumeAfterAlbumPick: () => null,
}));

vi.mock('@/features/browse/clearSelection', () => ({
  clearSelection: vi.fn(),
}));

vi.mock('@/lib/apiClient', () => ({
  api: { post: vi.fn(), get: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

describe('SelectionWorkspaceBar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    shortlistCompanyId.current = 'c1';
    navigate.mockReset();
    addStagingToCart.mockClear();
    setSelectModeShortlist.mockClear();
    setSelectModeAlbum.mockClear();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.post).mockImplementation(async (path: string, body?: unknown) => {
      if (path === '/threads/direct') return { id: 'thread-c1' } as never;
      if (String(path).includes('/messages')) {
        const type = (body as { type?: string })?.type;
        if (type === MessageType.ProductCard) return { id: 'card-1' } as never;
        return { id: 'm-text' } as never;
      }
      throw new Error(`unexpected post ${path}`);
    });
  });

  it('shows Add to cart · Message · Share + Order; no staging badge; no View row', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/explore']}>
          <ToastProvider>
            <SelectionWorkspaceBar />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(SELECTION_FLOATER_MIN_H).toBe('min-h-10');
    expect(screen.getByTestId('selection-workspace-bar')).toBeTruthy();
    const actions = screen.getByTestId('selection-workspace-actions');
    const cart = screen.getByTestId('selection-workspace-cart');
    expect(cart).toBeInTheDocument();
    expect(cart.textContent).toMatch(/Add to cart/);
    expect(cart.querySelector('.rounded-full.bg-accent')).toBeNull();
    expect(screen.getByTestId('selection-workspace-message')).toBeInTheDocument();
    expect(screen.getByTestId('selection-workspace-share')).toBeInTheDocument();
    expect(screen.getByTestId('selection-workspace-order').className).toContain('bg-accent');
    expect(screen.queryByTestId('selection-workspace-view')).toBeNull();
    expect(actions.textContent).toMatch(/Add to cart/);
    expect(actions.textContent).toMatch(/Order/);
  });

  it('Add to cart merges staging and exits Selecting', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/explore']}>
          <ToastProvider>
            <SelectionWorkspaceBar />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.click(screen.getByTestId('selection-workspace-cart'));
    expect(addStagingToCart).toHaveBeenCalled();
    expect(setSelectModeShortlist).toHaveBeenCalledWith(false);
    expect(setSelectModeAlbum).toHaveBeenCalledWith(false);
  });

  it('Message opens compose; Send posts one card with note and does not open Chats', async () => {
    const { clearSelection } = await import('@/features/browse/clearSelection');
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/explore']}>
          <ToastProvider>
            <SelectionWorkspaceBar />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByTestId('selection-workspace-message'));
    expect(screen.getByTestId('selection-message-sheet')).toBeInTheDocument();
    await user.type(screen.getByTestId('selection-message-text'), 'Have stock?');
    await user.click(screen.getByTestId('selection-message-send'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/threads/direct', { companyId: 'c1' });
      expect(api.post).toHaveBeenCalledWith('/threads/thread-c1/messages', {
        type: MessageType.ProductCard,
        referenceId: 'p1',
        body: 'Navy',
        metadata: { enquireNote: 'Have stock?' },
      });
    });
    expect(navigate).not.toHaveBeenCalledWith('/chats/thread-c1');
    expect(clearSelection).not.toHaveBeenCalled();
  });

  it('own-shop pile: Message disabled and Order for buyer', () => {
    shortlistCompanyId.current = 'me';
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/explore']}>
          <ToastProvider>
            <SelectionWorkspaceBar />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('selection-workspace-message')).toBeDisabled();
    expect(screen.getByTestId('selection-workspace-order')).toHaveTextContent('Order for buyer');
  });
});
