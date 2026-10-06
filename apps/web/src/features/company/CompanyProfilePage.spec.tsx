import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import {
  clearBrowseAlbumPick,
  readBrowseAlbumPick,
  writeBrowseAlbumPick,
} from '@/features/browse/browseAlbumPick';
import { clearBrowseShortlist, writeBrowseShortlist } from '@/features/browse/browseShortlist';
import { resetBrowseAlbumPickSelectMode } from '@/features/browse/useBrowseAlbumPick';
import { resetBrowseShortlistSelectMode } from '@/features/browse/useBrowseShortlist';
import { CompanyProfilePage } from './CompanyProfilePage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn(), post: vi.fn(), del: vi.fn(), patch: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/auth', () => ({
  useCompanyId: () => 'seed-company-meena',
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/tradePresence', () => ({
  useTradePresence: () => ({ buying: true, selling: true, trading: true }),
}));

vi.mock('@/features/orders/HowManyEachSheet', () => ({
  HowManyEachSheet: () => null,
}));

vi.mock('@/features/browse/CurateFromSelectionSheet', () => ({
  CurateFromSelectionSheet: () => null,
}));

vi.mock('./CompanyShareSheet', () => ({
  CompanyShareSheet: () => null,
}));

vi.mock('@/features/browse/OrderCollectionResolveSheet', () => ({
  OrderCollectionResolveSheet: () => null,
}));

const company = {
  id: 'seed-company-ravi',
  name: 'Surat Silk House',
  city: 'Surat',
  about: 'Silks',
  verification: 'gst_verified',
  logoUrl: null,
  categories: ['Silk'],
};

function renderPage(fromChat = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/company/seed-company-ravi',
            state: fromChat ? { fromChat: true } : undefined,
          },
        ]}
      >
        <Routes>
          <Route path="/company/:id" element={<CompanyProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CompanyProfilePage shop chrome', () => {
  afterEach(() => {
    cleanup();
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    resetBrowseShortlistSelectMode();
    resetBrowseAlbumPickSelectMode();
  });

  beforeEach(() => {
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    resetBrowseShortlistSelectMode();
    resetBrowseAlbumPickSelectMode();
    localStorage.removeItem('ekum.designBrowseLayout.seed-company-meena');
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') return company;
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/follows/following') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        return {
          results: [
            {
              id: 'col1',
              name: 'Wedding Edit',
              categories: [],
              memberFind: [],
              coverImage: 'https://cdn/cover.jpg',
              previewImages: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
              imageCount: 2,
              productCount: 4,
              status: 'published',
              updatedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              orderPathPreference: null,
              company,
            },
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-ravi/designs') {
        return {
          results: [
            {
              id: 'd1',
              name: 'Red silk saree',
              images: ['https://cdn/d1.jpg'],
              rate: null,
              company,
            },
          ],
          nextCursor: null,
        };
      }
      return [];
    });
  });

  it('keeps Message when opened from a 1:1', async () => {
    renderPage(true);
    expect(await screen.findByTestId('company-follow')).toBeInTheDocument();
    expect(screen.getByTestId('company-message')).toHaveTextContent('Message');
    expect(screen.queryByTestId('company-request')).toBeNull();
    expect(screen.getByTestId('company-follow')).toHaveTextContent('Request catalog access');
    expect(screen.queryByTestId('company-follow-hint')).toBeNull();
    expect(screen.getByTestId('company-more')).toHaveAttribute('aria-label', 'More');
  });

  it('shows Message when not connected', async () => {
    renderPage(false);
    expect(await screen.findByTestId('company-message')).toHaveTextContent('Message');
  });

  it('shows Chat when connected', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') return { ...company, connected: true };
      if (path === '/connections') {
        return [{ id: 'cn1', status: 'active', company }];
      }
      if (path === '/follows/following') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        return { results: [], nextCursor: null };
      }
      if (path === '/companies/seed-company-ravi/designs') {
        return { results: [], nextCursor: null };
      }
      if (path === '/companies/seed-company-ravi/contact') {
        return [{ name: 'Ravi', role: 'Owner', phone: '+919800000001' }];
      }
      return [];
    });
    renderPage(false);
    expect(await screen.findByTestId('company-message')).toHaveTextContent('Chat');
    expect(await screen.findByTestId('company-contact')).toHaveTextContent('Ravi Owner');
    expect(screen.queryByText('+919800000001')).toBeNull();
  });

  it('puts a GST tick by the name and city with category under it', async () => {
    renderPage(false);
    expect(await screen.findByRole('heading', { name: 'Surat Silk House' })).toBeInTheDocument();
    expect(screen.getAllByTestId('gst-tick')[0]).toHaveAttribute('aria-label', 'GST verified');
    expect(screen.getByTestId('shop-identity').textContent).toMatch(/Surat/);
    expect(screen.getByTestId('shop-identity').textContent).not.toMatch(/Silk/);
    expect(screen.getByTestId('shop-category-chips')).toHaveTextContent('Silk');
    expect(screen.queryByText('GST verified')).toBeNull();
  });

  it('shows the design name on the shop grid', async () => {
    const user = userEvent.setup();
    renderPage(false);
    const collectionsTab = await screen.findByTestId('company-shop-tab-collections');
    const designsTab = screen.getByTestId('company-shop-tab-designs');
    expect(collectionsTab).toHaveTextContent('Collections');
    expect(collectionsTab).not.toHaveTextContent('·');
    expect(designsTab).toHaveTextContent('Designs');
    expect(designsTab).not.toHaveTextContent('·');
    await user.click(designsTab);
    expect(await screen.findByTestId('company-shop-grid')).toBeInTheDocument();
    expect(screen.getByTestId('company-shop-layout-toggle')).toHaveAttribute(
      'aria-label',
      'Grid view',
    );
    expect(screen.getByTestId('company-shop-grid')).toHaveAttribute('data-layout', 'feed');
    await userEvent.click(screen.getByTestId('company-shop-layout-toggle'));
    expect(screen.getByTestId('company-shop-grid')).toHaveAttribute('data-layout', 'grid');
    expect(screen.getByTestId('company-shop-design-d1')).toHaveAttribute(
      'aria-label',
      'Red silk saree',
    );
    expect(screen.getByTestId('company-shop-design-d1-open')).toHaveAttribute(
      'href',
      '/explore/products/d1',
    );
    expect(screen.getByText('Red silk saree')).toBeInTheDocument();
    expect(screen.queryByText('Design', { exact: true })).toBeNull();
  });

  it('shows More in the header with Share and Block', async () => {
    const user = userEvent.setup();
    renderPage(false);
    expect(await screen.findByTestId('company-more')).toHaveAttribute('aria-label', 'More');
    expect(screen.queryByTestId('company-edit')).toBeNull();
    await user.click(screen.getByTestId('company-more'));
    expect(screen.getByTestId('company-overflow-share')).toBeInTheDocument();
    expect(screen.getByTestId('company-overflow-block')).toBeInTheDocument();
    expect(screen.queryByTestId('company-overflow-mute')).toBeNull();
    expect(screen.queryByTestId('company-overflow-remove')).toBeNull();
  });

  it('shows Mute and Remove connection when chat + Has access', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') {
        return { ...company, following: true, hasChat: true };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [company];
      if (path === '/threads') {
        return {
          results: [
            {
              id: 't1',
              type: 'direct',
              visibility: 'shared',
              title: null,
              state: 'active',
              alertLevel: 'all',
              pinned: false,
              unreadCount: 0,
              lastMessage: null,
              lastMessageAt: '2026-01-01T00:00:00.000Z',
              counterpart: company,
              participantCount: 2,
            },
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-ravi/collections') {
        return { results: [], nextCursor: null };
      }
      if (path === '/companies/seed-company-ravi/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    renderPage(false);
    const follow = await screen.findByTestId('company-follow');
    expect(follow).toHaveTextContent('Has access');
    expect(follow.querySelector('svg')).toBeTruthy();
    await user.click(screen.getByTestId('company-more'));
    const rows = screen.getAllByRole('menuitem').map((node) => node.textContent);
    expect(rows).toEqual(['Share', 'Mute', 'Block', 'Remove connection']);
  });

  it('shows lock with Request catalog access when idle', async () => {
    renderPage(false);
    const follow = await screen.findByTestId('company-follow');
    expect(follow).toHaveTextContent('Request catalog access');
    expect(follow.querySelector('svg')).toBeTruthy();
  });

  it('shows Edit and More on own shop', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena') {
        return { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' };
      }
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/follows/following') return [];
      if (path === '/companies/seed-company-meena/collections') {
        return { results: [], nextCursor: null };
      }
      if (path === '/companies/seed-company-meena/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/company/seed-company-meena']}>
          <Routes>
            <Route path="/company/:id" element={<CompanyProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('company-edit')).toBeInTheDocument();
    expect(screen.getByTestId('company-more')).toBeInTheDocument();
    expect(screen.queryByTestId('company-follow')).toBeNull();
    await userEvent.click(screen.getByTestId('company-more'));
    expect(screen.getByTestId('company-overflow-share')).toBeInTheDocument();
    expect(screen.queryByTestId('company-overflow-block')).toBeNull();
  });

  it('opens the trade dock for this shops picks only', async () => {
    writeBrowseShortlist([
      {
        productId: 'other',
        name: 'Other',
        thumbUrl: null,
        companyId: 'seed-company-meena',
        companyName: 'Jaipur Emporium',
      },
      {
        productId: 'd1',
        name: 'Red silk saree',
        thumbUrl: null,
        companyId: 'seed-company-ravi',
        companyName: 'Surat Silk House',
      },
    ]);
    renderPage(false);
    expect(await screen.findByTestId('company-shop-dock')).toBeInTheDocument();
    expect(screen.getByTestId('company-shop-order')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask for rates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Curate' })).toBeInTheDocument();
  });

  it('shows collection name and mosaic on the Collections tab', async () => {
    const user = userEvent.setup();
    renderPage(false);
    await user.click(await screen.findByTestId('company-shop-tab-collections'));
    expect(screen.getByTestId('company-shop-grid')).toHaveAttribute('data-layout', 'feed');
    expect(screen.getByRole('heading', { name: 'Surat Silk House' })).toBeInTheDocument();
    expect(screen.getAllByText('Surat Silk House')).toHaveLength(1);
    expect(screen.getByText('Wedding Edit')).toBeInTheDocument();
    await user.click(screen.getByTestId('company-shop-layout-toggle'));
    expect(screen.getByTestId('company-shop-grid')).toHaveAttribute('data-layout', 'grid');
    expect(screen.getByTestId('company-shop-collection-col1')).toHaveAttribute(
      'aria-label',
      'Wedding Edit',
    );
    expect(screen.getByTestId('company-shop-collection-open-col1')).toHaveAttribute(
      'href',
      '/collections/col1',
    );
    expect(screen.getByText('Wedding Edit')).toBeInTheDocument();
    expect(screen.queryByText(/^\d+ designs?$/)).toBeNull();
  });

  it('Clear unselects a collection on this shop even if stored under another company', async () => {
    writeBrowseAlbumPick([
      {
        collectionId: 'col1',
        name: 'Wedding Edit',
        coverImage: null,
        companyId: 'someone-else',
        companyName: 'Other',
      },
    ]);
    const user = userEvent.setup();
    renderPage(false);
    expect(await screen.findByTestId('company-shop-dock')).toBeInTheDocument();
    await user.click(screen.getByTestId('company-shop-tab-collections'));
    expect(screen.getByTestId('select-all-float')).toHaveTextContent('1 selected');
    await user.click(screen.getByTestId('select-all-float-clear'));
    expect(readBrowseAlbumPick()).toEqual([]);
    expect(screen.queryByTestId('company-shop-dock')).toBeNull();
  });

  it('opens the trade dock when this shops collection is selected', async () => {
    writeBrowseAlbumPick([
      {
        collectionId: 'col1',
        name: 'Wedding Edit',
        coverImage: null,
        companyId: 'seed-company-ravi',
        companyName: 'Surat Silk House',
      },
    ]);
    renderPage(false);
    expect(await screen.findByTestId('company-shop-dock')).toBeInTheDocument();
  });

  it('does not open the dock when only other shops are selected', async () => {
    writeBrowseShortlist([
      {
        productId: 'other',
        name: 'Other',
        thumbUrl: null,
        companyId: 'seed-company-meena',
        companyName: 'Jaipur Emporium',
      },
    ]);
    renderPage(false);
    expect(await screen.findByTestId('company-shop-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('company-shop-dock')).toBeNull();
  });
});
