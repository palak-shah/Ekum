import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/ui/Toast';
import { api } from '@/lib/apiClient';
import { CurateFromSelectionSheet } from './CurateFromSelectionSheet';
import type { BrowseShortlistEntry } from './browseShortlist';

const designs: BrowseShortlistEntry[] = [
  {
    productId: 'p1',
    name: 'Silk',
    thumbUrl: null,
    companyId: 'mill',
    companyName: 'Mill',
    sourceCollectionId: 'mill-pack',
  },
  {
    productId: 'p2',
    name: 'Cotton',
    thumbUrl: null,
    companyId: 'mill',
    companyName: 'Mill',
    sourceCollectionId: 'mill-pack',
  },
];

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me', capabilities: { publish: true } } }),
}));

vi.mock('@/lib/tradePresence', () => ({
  useTradePresence: () => ({ trading: true, buying: true, selling: true }),
}));

vi.mock('@/features/browse/useBrowseShortlist', () => ({
  useBrowseShortlist: () => ({
    entries: [],
    removeIds: vi.fn(),
  }),
}));

vi.mock('@/features/browse/useBrowseCart', () => ({
  useBrowseCart: () => ({
    designs,
    albums: [],
  }),
}));

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(async () => []),
    post: vi.fn(async () => ({ allowedProductIds: [], blocked: [] })),
    put: vi.fn(async () => ({})),
    del: vi.fn(async () => ({})),
  },
  ApiError: class ApiError extends Error {
    code?: string;
  },
}));

function tree(
  client: QueryClient,
  props?: { defaultName?: string; productIds?: string[] },
) {
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>
          <CurateFromSelectionSheet
            open
            onClose={() => undefined}
            productIds={props?.productIds ?? ['p1', 'p2']}
            defaultName={props?.defaultName ?? 'Wedding Edit'}
          />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CurateFromSelectionSheet', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async () => []);
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return {
          allowedProductIds: [],
          blocked: [
            { productId: 'p1', code: 'NOT_DISCOVERABLE' },
            { productId: 'p2', code: 'NOT_DISCOVERABLE' },
          ],
        };
      }
      if (path === '/relist-requests/access') {
        return { pendingByProductId: {} };
      }
      return {};
    });
  });

  it('hides choose paths when no designs are allowed', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(client));
    expect(await screen.findByTestId('repost-unavailable-summary')).toHaveTextContent(
      '2 designs unavailable',
    );
    expect(screen.queryByTestId('repost-path-choose')).toBeNull();
    expect(screen.queryByTestId('curate-blocked-ask')).toBeNull();
  });

  it('keeps a typed name after the parent re-renders', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1', 'p2'], blocked: [] };
      }
      if (path === '/relist-requests/access') {
        return { pendingByProductId: {} };
      }
      return {};
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(tree(client));
    await user.click(await screen.findByTestId('repost-path-new'));
    const name = await screen.findByTestId('repost-name');
    expect(name).toHaveValue('Wedding Edit');
    await user.clear(name);
    await user.type(name, 'My Wedding Edit');
    rerender(tree(client, { defaultName: 'Wedding Edit' }));
    expect(screen.getByTestId('repost-name')).toHaveValue('My Wedding Edit');
  });

  it('stamps the unique source pack hop on Add new', async () => {
    const user = userEvent.setup();
    const created = { id: 'draft-1', products: [] };
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1', 'p2'], blocked: [] };
      }
      if (path === '/relist-requests/access') {
        return { pendingByProductId: {} };
      }
      if (path === '/collections') {
        return created;
      }
      return {};
    });
    vi.mocked(api.put).mockResolvedValue({ id: 'draft-1', products: [] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(client));
    await user.click(await screen.findByTestId('repost-path-new'));
    await user.click(await screen.findByTestId('repost-publish'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/collections',
        expect.objectContaining({
          name: 'Wedding Edit',
          repostSourceCollectionId: 'mill-pack',
        }),
      );
    });
  });
});
