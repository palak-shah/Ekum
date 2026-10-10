import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { CollectionCard } from '@ekum/domain-types';
import { ToastProvider } from '@/ui/Toast';
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
            },
          ],
        };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
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

  it('Message opens quick enquire bar and does not navigate to Chats', async () => {
    const user = userEvent.setup();
    wrap(<ExploreFeedActions collection={collection} />);
    await user.click(screen.getByTestId('explore-feed-message'));
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId('selection-message-sheet')).toBeTruthy();
    expect(screen.getByPlaceholderText('What do you think of this?')).toBeTruthy();
  });
});
