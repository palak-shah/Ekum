import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { CollectionCard } from '@ekum/domain-types';
import { ToastProvider } from '@/ui/Toast';
import { api } from '@/lib/apiClient';
import { ExploreFeedActions } from './ExploreFeedActions';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me', capabilities: { publish: true } } }),
}));

vi.mock('@/lib/tradePresence', () => ({
  useTradePresence: () => ({ trading: true, buying: true, selling: true }),
}));

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return {
          id: 'col-1',
          products: [
            {
              id: 'p1',
              companyId: 'mill',
              audience: 'followers',
              name: 'Silk',
              images: [],
            },
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
  },
  ApiError: class ApiError extends Error {
    code?: string;
  },
}));

const collection: CollectionCard = {
  id: 'col-1',
  name: 'Wedding Edit',
  description: null,
  categories: [],
  memberFind: [],
  coverImage: null,
  previewImages: [],
  imageCount: 0,
  productCount: 1,
  status: 'published',
  updatedAt: '2026-10-01T00:00:00.000Z',
  allowForward: true,
  orderPathPreference: null,
  rateMin: null,
  rateMax: null,
  rateUnit: null,
  exploreNewDesignCount: 0,
  showSourceShops: false,
  sourceShopNames: [],
  viewerReposted: false,
  repostEligibleCount: 1,
  company: {
    id: 'mill',
    name: 'Ahmedabad Loom Co',
    city: 'Ahmedabad',
    logoUrl: null,
    verification: 'gst_verified',
    sellCategories: ['Fabric'],
  },
};

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>{ui}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ExploreFeedActions', () => {
  beforeEach(() => {
    navigate.mockClear();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return {
          id: 'col-1',
          products: [
            {
              id: 'p1',
              companyId: 'mill',
              audience: 'followers',
              name: 'Silk',
              images: [],
            },
          ],
        };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockImplementation(async () => ({
      allowedProductIds: ['p1'],
      blocked: [],
    }));
  });

  it('always shows Repost · Message · Share · Bookmark', () => {
    wrap(<ExploreFeedActions collection={collection} />);
    expect(screen.getByTestId('explore-feed-repost')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-message')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-share')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-bookmark')).toBeEnabled();
  });

  it('opens Repost sheet on this page — does not navigate to Your selection', async () => {
    const user = userEvent.setup();
    wrap(<ExploreFeedActions collection={collection} />);
    await user.click(screen.getByTestId('explore-feed-repost'));
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Repost' })).toBeTruthy();
    expect(screen.getByTestId('repost-publish')).toBeTruthy();
    expect(screen.getByTestId('repost-link-48h')).toBeTruthy();
  });

  it('Message opens enquire sheet with attachment and To shop', async () => {
    const user = userEvent.setup();
    wrap(<ExploreFeedActions collection={collection} />);
    await user.click(screen.getByTestId('explore-feed-message'));
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId('selection-message-sheet')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Message' })).toBeTruthy();
    expect(screen.getByTestId('selection-message-to')).toHaveTextContent(
      `To ${collection.company.name}`,
    );
    expect(screen.getByTestId('selection-message-attachment')).toHaveTextContent(
      collection.name,
    );
    expect(screen.getByPlaceholderText('What do you think of this?')).toBeTruthy();
  });

  it('grays out Message and Repost on own posts; Share · Bookmark stay enabled', () => {
    wrap(
      <ExploreFeedActions
        collection={{
          ...collection,
          company: { ...collection.company, id: 'me', name: 'My Shop' },
        }}
      />,
    );
    expect(screen.getByTestId('explore-feed-message')).toBeDisabled();
    expect(screen.getByTestId('explore-feed-repost')).toBeDisabled();
    expect(screen.getByTestId('explore-feed-bookmark')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-share')).toBeEnabled();
  });

  it('shows done Repost icon when viewer already reposted — not gray; toast; no sheet', async () => {
    const user = userEvent.setup();
    wrap(<ExploreFeedActions collection={{ ...collection, viewerReposted: true }} />);
    const repost = screen.getByTestId('explore-feed-repost');
    expect(repost).toHaveAttribute('data-repost', 'done');
    expect(repost).toHaveAttribute('aria-label', 'Reposted');
    expect(repost.className).not.toMatch(/opacity-40/);
    expect(repost).not.toBeDisabled();
    await user.click(repost);
    expect(screen.queryByRole('heading', { name: 'Repost' })).toBeNull();
    expect(screen.getByText('You already reposted this.')).toBeTruthy();
  });

  it('grays out Repost when zero designs are eligible; Share stays on; tap does not open sheet', async () => {
    const user = userEvent.setup();
    wrap(
      <ExploreFeedActions
        collection={{ ...collection, allowForward: true, repostEligibleCount: 0 }}
      />,
    );
    const repost = screen.getByTestId('explore-feed-repost');
    expect(repost).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('explore-feed-share')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-message')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-bookmark')).toBeEnabled();
    await user.click(repost);
    expect(screen.queryByRole('heading', { name: 'Repost' })).toBeNull();
    expect(
      screen.getByText("You don't have permission to repost these designs."),
    ).toBeTruthy();
  });

  it('keeps Repost on when some designs are eligible', () => {
    wrap(
      <ExploreFeedActions
        collection={{ ...collection, productCount: 8, repostEligibleCount: 3 }}
      />,
    );
    expect(screen.getByTestId('explore-feed-repost')).toBeEnabled();
  });

  it('keeps actions enabled while Selecting', () => {
    wrap(<ExploreFeedActions collection={collection} selecting />);
    expect(screen.getByTestId('explore-feed-actions')).toBeInTheDocument();
    expect(screen.getByTestId('explore-feed-repost')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-message')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-share')).toBeEnabled();
    expect(screen.getByTestId('explore-feed-bookmark')).toBeEnabled();
  });

  it('groups zero eligible members as unavailable — no Ask, no Repost CTA', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockImplementation(async () => ({
      allowedProductIds: [],
      blocked: [{ productId: 'p1', code: 'NOT_DISCOVERABLE' }],
    }));
    wrap(<ExploreFeedActions collection={collection} />);
    await user.click(screen.getByTestId('explore-feed-repost'));
    expect(await screen.findByTestId('repost-unavailable-summary')).toHaveTextContent(
      '1 design unavailable',
    );
    expect(screen.getByTestId('repost-unavailable-summary')).toHaveTextContent(
      "These designs haven't been individually published for adding to other collections.",
    );
    expect(screen.queryByTestId('repost-publish')).toBeNull();
    expect(screen.queryByTestId('curate-blocked-ask')).toBeNull();
  });

  it('lists mixed packs with skipped designs collapsed', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return {
          id: 'col-1',
          products: [
            { id: 'p1', companyId: 'mill', audience: 'followers', name: 'Silk', images: [] },
            { id: 'p2', companyId: 'mill', audience: 'followers', name: 'Cotton', images: [] },
          ],
        };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockImplementation(async () => ({
      allowedProductIds: ['p1'],
      blocked: [{ productId: 'p2', code: 'NOT_DISCOVERABLE' }],
    }));
    wrap(
      <ExploreFeedActions collection={{ ...collection, productCount: 2, repostEligibleCount: 1 }} />,
    );
    await user.click(screen.getByTestId('explore-feed-repost'));
    expect(await screen.findByTestId('repost-eligible-list')).toHaveTextContent('Silk');
    expect(screen.getByTestId('repost-skipped-toggle')).toHaveTextContent('Skipped designs (1)');
    expect(screen.queryByTestId('curate-blocked-list')).toBeNull();
    await user.click(screen.getByTestId('repost-skipped-toggle'));
    expect(screen.getByTestId('curate-blocked-list')).toHaveTextContent('Cotton');
    expect(screen.getByTestId('repost-publish')).toBeTruthy();
    expect(screen.getByTestId('curate-skip-info')).toBeTruthy();
  });

  it('hides Who and Repost when pack preview has no designs', async () => {
    const user = userEvent.setup();
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
    wrap(<ExploreFeedActions collection={collection} />);
    await user.click(screen.getByTestId('explore-feed-repost'));
    expect(await screen.findByTestId('repost-unavailable-summary')).toHaveTextContent(
      'These designs can’t go in a collection yet.',
    );
    expect(screen.queryByTestId('repost-publish')).toBeNull();
    expect(screen.queryByTestId('repost-name')).toBeNull();
    expect(screen.queryByText('Who can see this?')).toBeNull();
  });

  it('hides Who and Repost when pack preview fails', async () => {
    const user = userEvent.setup();
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
    wrap(<ExploreFeedActions collection={collection} />);
    await user.click(screen.getByTestId('explore-feed-repost'));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load these designs.");
    expect(screen.queryByTestId('repost-publish')).toBeNull();
    expect(screen.queryByTestId('repost-name')).toBeNull();
    expect(screen.queryByText('Who can see this?')).toBeNull();
  });
});
