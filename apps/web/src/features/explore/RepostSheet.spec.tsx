import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/ui/Toast';
import { api } from '@/lib/apiClient';
import { RepostSheet, type RepostSheetTarget } from './RepostSheet';

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me', capabilities: { publish: true } } }),
}));

const { MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
    }
  }
  return { MockApiError };
});

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return {
          id: 'col-1',
          products: [
            { id: 'p1', companyId: 'mill', audience: 'followers', name: 'Silk', images: [] },
          ],
        };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    }),
    post: vi.fn(async () => ({ allowedProductIds: ['p1'], blocked: [] })),
    put: vi.fn(async () => ({})),
    del: vi.fn(async () => ({})),
  },
  ApiError: MockApiError,
}));

const target: RepostSheetTarget = {
  kind: 'collection',
  collectionId: 'col-1',
  name: 'Wedding Edit',
  coverImage: 'blob:http://localhost/pack',
};

function tree(next: RepostSheetTarget, client: QueryClient) {
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>
          <RepostSheet open onClose={() => undefined} target={next} />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RepostSheet', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return {
          id: 'col-1',
          products: [
            { id: 'p1', companyId: 'mill', audience: 'followers', name: 'Silk', images: [] },
          ],
        };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockReset();
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      return { id: 'new-col' };
    });
  });

  it('keeps a typed name when the target object identity changes', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(tree(target, client));
    const name = await screen.findByTestId('repost-name');
    await user.clear(name);
    await user.type(name, 'My Wedding Edit');
    expect(name).toHaveValue('My Wedding Edit');
    rerender(tree({ ...target, coverImage: 'blob:http://localhost/other' }, client));
    expect(screen.getByTestId('repost-name')).toHaveValue('My Wedding Edit');
  });

  it('omits a non-http cover URL on create', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(target, client));
    const publish = await screen.findByTestId('repost-publish');
    await user.click(publish);
    const createCall = vi
      .mocked(api.post)
      .mock.calls.find((call) => call[0] === '/collections');
    expect(createCall?.[1]).not.toHaveProperty('coverImage');
  });

  it('sends an absolute http cover and keeps a typed name after a clash', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      if (path === '/collections') {
        throw new MockApiError('You already have this collection.', 'COLLECTION_NAME_TAKEN');
      }
      return { id: 'new-col' };
    });
    render(
      tree({ ...target, coverImage: 'https://cdn.example/pack.jpg' }, client),
    );
    const name = await screen.findByTestId('repost-name');
    await user.clear(name);
    await user.type(name, 'My Wedding Edit');
    await user.click(screen.getByTestId('repost-publish'));
    expect(await screen.findByText('You already have this collection.')).toBeTruthy();
    expect(screen.getByTestId('repost-name')).toHaveValue('My Wedding Edit');
    const createCalls = vi
      .mocked(api.post)
      .mock.calls.filter((call) => call[0] === '/collections');
    expect(createCalls.at(-1)?.[1]).toMatchObject({
      name: 'My Wedding Edit',
      coverImage: 'https://cdn.example/pack.jpg',
    });
  });

  it('hides Who and Repost when pack preview has no designs', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return { id: 'col-1', products: [] };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(target, client));
    expect(await screen.findByTestId('repost-unavailable-summary')).toHaveTextContent(
      'These designs can’t go in a collection yet.',
    );
    expect(screen.queryByTestId('repost-publish')).toBeNull();
    expect(screen.queryByTestId('repost-name')).toBeNull();
    expect(screen.queryByText('Who can see this?')).toBeNull();
  });

  it('hides Who and Repost when pack preview fails', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        throw new Error('not found');
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(target, client));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load these designs.");
    expect(screen.queryByTestId('repost-publish')).toBeNull();
    expect(screen.queryByTestId('repost-name')).toBeNull();
    expect(screen.queryByText('Who can see this?')).toBeNull();
  });
});
