import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import {
  clearBrowseAlbumPick,
  readBrowseAlbumPick,
  writeBrowseAlbumPick,
} from '@/features/browse/browseAlbumPick';
import {
  clearBrowseShortlist,
  readBrowseShortlist,
  writeBrowseShortlist,
} from '@/features/browse/browseShortlist';
import { resetBrowseAlbumPickSelectMode } from '@/features/browse/useBrowseAlbumPick';
import { resetBrowseShortlistSelectMode } from '@/features/browse/useBrowseShortlist';
import {
  BusinessProfileBody,
  CompanyProfilePage,
  ShopCataloguePage,
} from './CompanyProfilePage';
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

vi.mock('@/features/orders/HowManyEachSheet', () => ({
  HowManyEachSheet: () => null,
}));

vi.mock('@/features/browse/SelectionMessageSheet', () => ({
  SelectionMessageSheet: () => null,
}));

vi.mock('@/features/browse/CatalogShareSheet', () => ({
  CatalogShareSheet: () => null,
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
  coverUrl: null as string | null,
  showcaseUrls: [] as string[],
  profileAccess: true as boolean,
  profileVisibility: 'public',
  categories: ['Silk'],
  createdAt: '2026-09-15T00:00:00.000Z',
};

function shopPack(id: string, name: string, shop = company) {
  return {
    id,
    name,
    kind: 'regular',
    description: null,
    categories: [],
    memberFind: [],
    coverImage: 'https://cdn/cover.jpg',
    previewImages: ['https://cdn/a.jpg'],
    imageCount: 1,
    productCount: 1,
    status: 'published',
    updatedAt: '2026-01-01T00:00:00.000Z',
    allowForward: true,
    orderPathPreference: null,
    rateMin: null,
    rateMax: null,
    rateUnit: null,
    exploreNewDesignCount: 0,
    showSourceShops: false,
    sourceShopNames: [],
    viewerReposted: false,
    company: shop,
  };
}

function AlbumLanded() {
  const location = useLocation();
  const packManage = Boolean(
    location.state &&
      typeof location.state === 'object' &&
      'packManage' in location.state &&
      (location.state as { packManage?: boolean }).packManage,
  );
  return <div data-testid="album-landed" data-pack-manage={packManage ? '1' : '0'} />;
}

function shopRoutes() {
  return (
    <>
      <Route path="/company/:id" element={<CompanyProfilePage />} />
      <Route path="/company/:id/catalogue" element={<ShopCataloguePage />} />
      <Route path="/collections/:id" element={<AlbumLanded />} />
      <Route path="/catalog/products/:id" element={<div data-testid="design-editor" />} />
      <Route path="/more" element={<div data-testid="you-landed" />} />
    </>
  );
}

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
        <Routes>{shopRoutes()}</Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderCataloguePage(search = '') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter
        initialEntries={[`/company/seed-company-ravi/catalogue${search}`]}
      >
        <Routes>{shopRoutes()}</Routes>
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
      if (path === '/companies/me') {
        return { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' };
      }
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        return {
          results: [
            {
              id: 'col1',
              name: 'Wedding Edit',
              description: null,
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
              rateMin: null,
              rateMax: null,
              rateUnit: null,
    exploreNewDesignCount: 0,
    showSourceShops: false,
    sourceShopNames: [],
              viewerReposted: false,
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
              rateMax: null,
              unit: null,
              categories: [],
              postedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
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
    expect(screen.getByTestId('business-profile-share')).toBeInTheDocument();
    expect(screen.queryByTestId('company-request')).toBeNull();
    expect(screen.getByTestId('company-follow')).toHaveTextContent('Follow');
    expect(screen.queryByTestId('company-follow-hint')).toBeNull();
    expect(screen.getByTestId('company-more')).toHaveAttribute('aria-label', 'More');
  });

  it('shows Message when not connected', async () => {
    renderPage(false);
    expect(await screen.findByTestId('company-message')).toHaveTextContent('Message');
    expect(screen.getByTestId('business-profile-share')).toBeInTheDocument();
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
    expect(screen.getByTestId('shop-identity').textContent).toMatch(/Ravi Owner · Surat/);
    // Phone stays off the identity line; Business info shows opted-in contact phones.
    expect(screen.getByTestId('shop-identity').textContent).not.toMatch(/\+919800000001/);
    expect(screen.getByTestId('business-info-contacts')).toHaveTextContent('+919800000001');
  });

  it('Following uses filled accent classes without bg-surface', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') {
        return { ...company, connected: true, following: true };
      }
      if (path === '/connections') {
        return [{ id: 'cn1', status: 'active', company }];
      }
      if (path === '/follows/following') return [{ id: 'seed-company-ravi' }];
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
    const follow = await screen.findByTestId('company-follow');
    expect(follow).toHaveTextContent('Following');
    expect(follow.className).toMatch(/bg-accent/);
    expect(follow.className).toMatch(/text-on-accent/);
    expect(follow.className).not.toMatch(/bg-surface/);
  });

  it('puts a GST tick by the name and city with category under it', async () => {
    renderPage(false);
    expect(await screen.findByRole('heading', { name: 'Surat Silk House' })).toBeInTheDocument();
    expect(screen.getAllByTestId('gst-tick')[0]).toHaveAttribute('aria-label', 'GST verified');
    expect(screen.getByTestId('shop-identity').textContent).toMatch(/Surat/);
    expect(screen.getByTestId('shop-identity').textContent).not.toMatch(/Silk/);
    expect(screen.getByTestId('shop-category-line')).toHaveTextContent('Silk');
    expect(screen.queryByTestId('shop-category-chips')).toBeNull();
    // GST copy lives in Business info, not under the hero identity.
    expect(screen.getByTestId('business-info-gst')).toHaveTextContent('GST verified');
  });

  it('shows the design name on the shop preview grid', async () => {
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
    expect(screen.queryByTestId('company-shop-layout-toggle')).toBeNull();
    expect(screen.queryByTestId('company-shop-select')).toBeNull();
    expect(screen.getByTestId('company-shop-grid')).toHaveAttribute('data-layout', 'grid');
    expect(screen.getByTestId('business-profile-view-all')).toHaveAttribute(
      'href',
      '/company/seed-company-ravi/catalogue?tab=products',
    );
    expect(screen.queryByTestId('company-shop-design-d1-open')).toBeNull();
    const tile = screen.getByTestId('company-shop-design-d1');
    await user.click(within(tile).getByTestId('catalog-product-photos'));
    expect(await screen.findByTestId('company-shop-design-sheet')).toBeInTheDocument();
    expect(screen.getAllByText('Red silk saree').length).toBeGreaterThan(0);
    expect(screen.queryByText('Design', { exact: true })).toBeNull();
    expect(screen.queryByTestId('company-shop-tab-catalogs')).toBeNull();
  });

  it('previews four collections on the visitor shop with View all', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') return company;
      if (path === '/companies/me') {
        return { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        return {
          results: [
            shopPack('col-a', 'Pack A'),
            shopPack('col-b', 'Pack B'),
            shopPack('col-c', 'Pack C'),
            shopPack('col-d', 'Pack D'),
            shopPack('col-e', 'Pack E'),
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-ravi/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    renderPage(false);
    expect(await screen.findByTestId('you-collection-row-col-a')).toBeInTheDocument();
    expect(screen.getByTestId('you-collection-row-col-d')).toBeInTheDocument();
    expect(screen.queryByTestId('you-collection-row-col-e')).toBeNull();
    expect(screen.getByTestId('business-profile-view-all')).toHaveAttribute(
      'href',
      '/company/seed-company-ravi/catalogue?tab=collections',
    );
    expect(screen.queryByTestId('business-profile-view-more')).toBeNull();
    expect(screen.queryByTestId('company-shop-select')).toBeNull();
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

  it('shows Mute and Unfollow when chat + Following', async () => {
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
    expect(follow).toHaveTextContent('Following');
    expect(follow.querySelector('svg')).toBeTruthy();
    await user.click(screen.getByTestId('company-more'));
    const rows = screen.getAllByRole('menuitem').map((node) => node.textContent);
    expect(rows).toEqual(['Share', 'Mute', 'Block', 'Unfollow']);
    vi.mocked(api.del).mockResolvedValue({ following: false });
    await user.click(screen.getByTestId('company-overflow-remove'));
    expect(api.del).toHaveBeenCalledWith('/follows/seed-company-ravi');
    expect(api.del).not.toHaveBeenCalledWith(expect.stringMatching(/connections/));
  });

  it('shows lock with Follow when idle', async () => {
    renderPage(false);
    const follow = await screen.findByTestId('company-follow');
    expect(follow).toHaveTextContent('Follow');
    expect(follow.querySelector('svg')).toBeTruthy();
  });

  it('own shop URL redirects to Home (edit lives on home profile)', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/company/seed-company-meena']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-landed">Home</div>} />
            <Route path="/company/:id" element={<CompanyProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('home-landed')).toBeInTheDocument();
  });

  it('opens the trade dock for this shop’s picks only on the catalogue page', async () => {
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
    renderCataloguePage();
    expect(await screen.findByTestId('company-shop-dock')).toBeInTheDocument();
    expect(screen.getByTestId('company-shop-message')).toBeInTheDocument();
    expect(screen.getByTestId('company-shop-share')).toBeInTheDocument();
    expect(screen.getByTestId('company-shop-order')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ask for rates' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Curate' })).toBeNull();
    expect(screen.getByTestId('company-shop-message')).not.toBeDisabled();
  });

  it('keeps Select and Find on the catalogue page, not the shop face', async () => {
    renderCataloguePage();
    expect(await screen.findByTestId('business-profile-catalogue-page')).toBeInTheDocument();
    expect(screen.getByTestId('company-shop-select')).toBeInTheDocument();
    expect(screen.getByTestId('company-shop-search-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('page-header-back')).toBeInTheDocument();
  });

  it('lists every allowed collection on the catalogue page', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') return company;
      if (path === '/companies/me') {
        return { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        return {
          results: [
            shopPack('col-a', 'Pack A'),
            shopPack('col-b', 'Pack B'),
            shopPack('col-c', 'Pack C'),
            shopPack('col-d', 'Pack D'),
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-ravi/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    renderCataloguePage('?tab=collections');
    expect(await screen.findByTestId('you-collection-row-col-a')).toBeInTheDocument();
    expect(screen.getByTestId('you-collection-row-col-d')).toBeInTheDocument();
    expect(screen.queryByTestId('business-profile-view-all')).toBeNull();
  });

  it('own catalogue URL redirects to My collections', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/company/seed-company-meena/catalogue']}>
          <Routes>{shopRoutes()}</Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('you-landed')).toBeInTheDocument();
  });

  it('shows collection list rows on the Collections tab', async () => {
    renderPage(false);
    expect(await screen.findByTestId('company-shop-tab-collections')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('you-collection-row-col1')).toHaveAttribute(
      'href',
      '/collections/col1',
    );
    expect(screen.getByText('Wedding Edit')).toBeInTheDocument();
    expect(screen.queryByTestId('company-shop-layout-toggle')).toBeNull();
    expect(screen.queryByTestId('company-shop-tab-catalogs')).toBeNull();
    expect(screen.queryByText(/^\d+ designs?$/)).toBeNull();
    expect(screen.queryByText(/ago$/i)).toBeNull();
  });

  it('short tap opens the collection album', async () => {
    const user = userEvent.setup();
    renderPage(false);
    await user.click(await screen.findByTestId('you-collection-row-col1'));
    expect(await screen.findByTestId('album-landed')).toHaveAttribute('data-pack-manage', '0');
  });

  it('visitor collection more is Message · Share · Bookmark, not Hide', async () => {
    renderPage(false);
    const row = await screen.findByTestId('you-collection-row-col1');
    fireEvent.pointerDown(row, { clientX: 220, clientY: 24, pointerId: 1 });
    fireEvent.pointerMove(row, { clientX: 40, clientY: 24, pointerId: 1 });
    fireEvent.pointerUp(row, { pointerId: 1 });
    fireEvent.click(screen.getByTestId('you-collection-swipe-more'));
    expect(await screen.findByTestId('visitor-collection-more-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-message')).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-share')).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-bookmark')).toBeInTheDocument();
    expect(screen.queryByTestId('you-collection-hide')).toBeNull();
    expect(screen.queryByTestId('collection-menu-draft')).toBeNull();
  });

  it('long-press selects a collection on the catalogue page without opening the album', async () => {
    renderCataloguePage();
    const row = await screen.findByTestId('you-collection-row-col1');
    vi.useFakeTimers();
    fireEvent.pointerDown(row, { clientX: 40, clientY: 24, pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(row, { pointerId: 1 });
    vi.useRealTimers();
    expect(screen.getByTestId('company-shop-dock')).toBeInTheDocument();
    expect(screen.queryByTestId('album-landed')).toBeNull();
  });

  it('Selecting puts N selected · Select all · Clear on a pill row under the tabs (BM-07)', async () => {
    const user = userEvent.setup();
    renderCataloguePage();
    await screen.findByTestId('company-shop-select');
    await user.click(screen.getByTestId('company-shop-select'));
    const pillRow = screen.getByTestId('company-shop-select-pill-row');
    const chrome = within(pillRow).getByTestId('select-all-float');
    expect(chrome.className).toMatch(/rounded-full/);
    expect(within(pillRow).getByTestId('select-all-float-clear')).toHaveTextContent('Clear');
    expect(screen.queryByTestId('company-shop-select')).toBeNull();
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
    renderCataloguePage();
    expect(await screen.findByTestId('company-shop-dock')).toBeInTheDocument();
    await user.click(screen.getByTestId('company-shop-tab-collections'));
    expect(screen.getByTestId('select-all-float')).toHaveTextContent('1 selected');
    await user.click(screen.getByTestId('select-all-float-clear'));
    expect(readBrowseAlbumPick()).toEqual([]);
    expect(screen.queryByTestId('company-shop-dock')).toBeNull();
  });

  it('Collections tab Clear leaves designs, exits Selecting chrome (no stuck 0 selected)', async () => {
    writeBrowseShortlist([
      {
        productId: 'd1',
        name: 'Red silk saree',
        thumbUrl: null,
        companyId: 'seed-company-ravi',
        companyName: 'Surat Silk House',
      },
    ]);
    writeBrowseAlbumPick([
      {
        collectionId: 'col1',
        name: 'Wedding Edit',
        coverImage: null,
        companyId: 'seed-company-ravi',
        companyName: 'Surat Silk House',
      },
    ]);
    const user = userEvent.setup();
    renderCataloguePage();
    expect(await screen.findByTestId('company-shop-dock')).toBeInTheDocument();
    await user.click(await screen.findByTestId('company-shop-tab-collections'));
    expect(screen.getByTestId('select-all-float')).toHaveTextContent('1 selected');
    await user.click(screen.getByTestId('select-all-float-clear'));
    expect(readBrowseAlbumPick()).toEqual([]);
    expect(readBrowseShortlist()).toHaveLength(1);
    expect(screen.getByTestId('company-shop-dock')).toBeInTheDocument();
    // Clear exits Selecting — do not leave a dead “0 selected · Clear” via the dock.
    expect(screen.queryByTestId('select-all-float')).toBeNull();
    expect(screen.getByTestId('company-shop-select')).toBeInTheDocument();
  });

  it('Clear at 0 selected exits Selecting', async () => {
    const user = userEvent.setup();
    renderCataloguePage();
    await screen.findByTestId('company-shop-select');
    await user.click(screen.getByTestId('company-shop-select'));
    expect(screen.getByTestId('select-all-float')).toHaveTextContent('0 selected');
    await user.click(screen.getByTestId('select-all-float-clear'));
    expect(screen.queryByTestId('select-all-float')).toBeNull();
    expect(screen.getByTestId('company-shop-select')).toBeInTheDocument();
  });

  it('opens the trade dock when this shop’s collection is selected on catalogue', async () => {
    writeBrowseAlbumPick([
      {
        collectionId: 'col1',
        name: 'Wedding Edit',
        coverImage: null,
        companyId: 'seed-company-ravi',
        companyName: 'Surat Silk House',
      },
    ]);
    renderCataloguePage();
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
    renderCataloguePage();
    expect(await screen.findByTestId('business-profile-catalogue')).toBeInTheDocument();
    expect(screen.queryByTestId('company-shop-dock')).toBeNull();
  });

  it('shop face has no trade dock even when this shop has picks', async () => {
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
    expect(await screen.findByTestId('business-profile-catalogue')).toBeInTheDocument();
    expect(screen.queryByTestId('company-shop-dock')).toBeNull();
    expect(screen.queryByTestId('company-shop-select')).toBeNull();
  });

  it('defaults to Designs when Collections is empty', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') return company;
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        return { results: [], nextCursor: null };
      }
      if (path === '/companies/seed-company-ravi/designs') {
        return {
          results: [
            {
              id: 'd1',
              name: 'Red silk saree',
              images: ['https://cdn/d1.jpg'],
              rate: null,
              rateMax: null,
              unit: null,
              categories: [],
              postedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              company,
            },
          ],
          nextCursor: null,
        };
      }
      return [];
    });
    renderPage(false);
    expect(await screen.findByTestId('company-shop-tab-designs')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('company-shop-design-d1')).toBeInTheDocument();
  });

  it('keeps Designs after a tap when Collections also has rows', async () => {
    const user = userEvent.setup();
    renderPage(false);
    await user.click(await screen.findByTestId('company-shop-tab-designs'));
    expect(screen.getByTestId('company-shop-tab-designs')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('company-shop-design-d1')).toBeInTheDocument();
  });

  it('stays on Designs when tapped before the shelf seed runs', async () => {
    let releaseCollections: (() => void) | undefined;
    const collectionsGate = new Promise<void>((resolve) => {
      releaseCollections = resolve;
    });
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') return company;
      if (path === '/companies/me') {
        return { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' };
      }
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        await collectionsGate;
        return {
          results: [
            {
              id: 'col1',
              name: 'Wedding Edit',
              description: null,
              categories: [],
              memberFind: [],
              coverImage: 'https://cdn/cover.jpg',
              previewImages: ['https://cdn/a.jpg'],
              imageCount: 1,
              productCount: 4,
              status: 'published',
              updatedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              orderPathPreference: null,
              rateMin: null,
              rateMax: null,
              rateUnit: null,
              exploreNewDesignCount: 0,
              showSourceShops: false,
              sourceShopNames: [],
              viewerReposted: false,
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
              rateMax: null,
              unit: null,
              categories: [],
              postedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              company,
            },
          ],
          nextCursor: null,
        };
      }
      return [];
    });
    const user = userEvent.setup();
    renderPage(false);
    expect(await screen.findByRole('heading', { name: 'Surat Silk House' })).toBeInTheDocument();
    expect(screen.queryByTestId('company-shop-tab-designs')).toBeNull();
    releaseCollections?.();
    const designsTab = await screen.findByTestId('company-shop-tab-designs');
    await user.click(designsTab);
    expect(designsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('company-shop-design-d1')).toBeInTheDocument();
  });

  it('omits catalogue when shelf is empty after success', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') return company;
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        return { results: [], nextCursor: null };
      }
      if (path === '/companies/seed-company-ravi/designs') {
        return { results: [], nextCursor: null };
      }
      if (path === '/threads') return { results: [], nextCursor: null };
      return [];
    });
    renderPage(false);
    expect(await screen.findByText('Surat Silk House')).toBeInTheDocument();
    expect(screen.queryByTestId('business-profile-catalogue')).toBeNull();
    expect(screen.queryByTestId('company-shop-tab-collections')).toBeNull();
  });

  it('shows private stub and keeps Follow / Message', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') {
        return {
          ...company,
          profileAccess: false,
          coverUrl: null,
          showcaseUrls: [],
          about: null,
        };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/threads') return { results: [], nextCursor: null };
      return [];
    });
    renderPage(false);
    expect(await screen.findByTestId('business-profile-private')).toHaveTextContent(
      'This business is private.',
    );
    expect(screen.queryByTestId('business-profile-cover')).toBeNull();
    expect(screen.queryByTestId('business-profile-showcase')).toBeNull();
    expect(screen.queryByTestId('business-profile-catalogue')).toBeNull();
    expect(screen.queryByTestId('business-info')).toBeNull();
    expect(screen.queryByTestId('business-info-hours')).toBeNull();
    expect(screen.getByTestId('company-follow')).toBeInTheDocument();
    expect(screen.getByTestId('company-message')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-share')).toBeInTheDocument();
  });

  it('redirects own /company/:id to Home', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/company/seed-company-meena']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-landed">Home</div>} />
            <Route path="/company/:id" element={<CompanyProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('home-landed')).toBeInTheDocument();
  });
});

describe('CompanyProfilePage home variant', () => {
  afterEach(() => {
    cleanup();
    clearBrowseShortlist();
    clearBrowseAlbumPick();
    resetBrowseShortlistSelectMode();
    resetBrowseAlbumPickSelectMode();
  });

  beforeEach(() => {
    localStorage.removeItem('ekum.profileCompletenessDismissed.seed-company-meena');
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena' || path === '/companies/me') {
        return {
          ...company,
          id: 'seed-company-meena',
          name: 'Jaipur Emporium',
          coverUrl: 'https://cdn/cover.jpg',
          showcaseUrls: ['https://cdn/s1.jpg'],
          sellCategories: ['Silk'],
          buyCategories: [],
          gstNumber: null,
          contactPerson: 'Meena',
          contactPhone: null,
          showContactPhone: false,
          capabilities: { publish: true, relist: true, refer: true },
          tradePresence: { mill: false, trader: true, retailer: false },
          role: 'Owner',
          permissions: {
            uploads: true,
            chats: true,
            orders: true,
            payments: true,
            team: true,
          },
        };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/companies/seed-company-meena/collections') {
        return { results: [], nextCursor: null };
      }
      if (path === '/companies/seed-company-meena/designs') {
        return { results: [], nextCursor: null };
      }
      if (path === '/team/members') {
        return [
          {
            userId: 'meena',
            name: 'Meena',
            phoneMasked: '98******01',
            role: 'owner',
            permissions: {
              uploads: true,
              chats: true,
              orders: true,
              payments: true,
              team: true,
            },
            contactRole: null,
          },
        ];
      }
      return [];
    });
  });

  it('renders name, cover, home pills; omits empty catalogue and Follow', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
            <Route path="/network" element={<div />} />
            <Route path="/saved" element={<div />} />
            <Route path="/settings/profile" element={<div />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('business-profile-home')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-name')).toHaveTextContent('Jaipur Emporium');
    expect(screen.getByTestId('business-profile-name').querySelector('p')?.className).toMatch(
      /text-name/,
    );
    expect(screen.getByTestId('business-profile-cover')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-cover-camera')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-avatar-camera')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-view-showcase')).toBeInTheDocument();
    expect(screen.queryByTestId('business-profile-showcase')).toBeNull();
    expect(screen.getByTestId('company-edit')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-share')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-network')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-saved')).toBeInTheDocument();
    expect(screen.getByTestId('company-edit').className).toMatch(/bg-surface/);
    expect(screen.getByTestId('company-edit').className).toMatch(/border-line/);
    expect(screen.getByTestId('company-edit').className).not.toMatch(/bg-foam|bg-chip-on/);
    expect(screen.getByTestId('company-edit').className).toMatch(/flex-col/);
    expect(screen.queryByTestId('company-follow')).toBeNull();
    expect(screen.queryByTestId('business-profile-catalogue')).toBeNull();
    expect(screen.getByTestId('business-info')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Business info' }).className).toMatch(/text-ink/);
    expect(screen.getByTestId('business-info-team')).toHaveTextContent('Meena');
    expect(screen.getByTestId('business-info-team')).toHaveTextContent('Owner');
    expect(screen.getByTestId('business-info-since')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-avatar-block').className).toMatch(/items-center/);
  });

  it('shows catalogue tabs when shelf has collections (no Catalogue title)', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena') {
        return {
          ...company,
          id: 'seed-company-meena',
          name: 'Jaipur Emporium',
          coverUrl: 'https://cdn/cover.jpg',
          showcaseUrls: [],
        };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/companies/seed-company-meena/collections') {
        return {
          results: [
            {
              id: 'col-1',
              name: 'Wedding Edit',
              kind: 'pack',
              categories: [],
              memberFind: [],
              description: null,
              coverImage: 'https://cdn/p.jpg',
              previewImages: ['https://cdn/p.jpg'],
              imageCount: 1,
              productCount: 1,
              status: 'published',
              updatedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              orderPathPreference: null,
              rateMin: null,
              rateMax: null,
              rateUnit: null,
              exploreNewDesignCount: 0,
              showSourceShops: false,
              sourceShopNames: [],
              viewerReposted: false,
              company: { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' },
            },
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-meena/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('business-profile-catalogue')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-catalogue').className).not.toMatch(
      /rounded-xl border border-line/,
    );
    expect(screen.queryByTestId('business-profile-catalogue-heading')).toBeNull();
    expect(screen.getByTestId('company-shop-tab-collections').className).toMatch(/text-accent/);
    expect(screen.getByTestId('company-shop-tab-collections').className).not.toMatch(
      /border-badge|text-chip-on-ink/,
    );
    expect(screen.getByTestId('company-shop-tab-collections').className).not.toMatch(/bg-chip-on/);
    expect(screen.getByTestId('company-shop-collections').parentElement?.className).not.toMatch(
      /bg-chip-on/,
    );
    expect(screen.getByTestId('you-collection-row-col-1')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-view-more')).toHaveAttribute(
      'href',
      '/more?tab=collections',
    );
    expect(screen.queryByTestId('company-shop-select')).toBeNull();
  });

  it('shows four collections on Home and View more to My collections', async () => {
    const jaipur = { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' };
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena' || path === '/companies/me') {
        return { ...jaipur, coverUrl: 'https://cdn/cover.jpg', showcaseUrls: [] };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/team/members') return [];
      if (path === '/companies/seed-company-meena/collections') {
        return {
          results: [
            shopPack('col-1', 'One', jaipur),
            shopPack('col-2', 'Two', jaipur),
            shopPack('col-3', 'Three', jaipur),
            shopPack('col-4', 'Four', jaipur),
            shopPack('col-5', 'Five', jaipur),
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-meena/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
            <Route path="/more" element={<div data-testid="you-landed" />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('you-collection-row-col-1')).toBeInTheDocument();
    expect(screen.getByTestId('you-collection-row-col-4')).toBeInTheDocument();
    expect(screen.queryByTestId('you-collection-row-col-5')).toBeNull();
    expect(screen.getByTestId('business-profile-view-more')).toHaveAttribute(
      'href',
      '/more?tab=collections',
    );
  });

  it('Home ?tab=products keeps Designs and View more → You Designs (Back restores)', async () => {
    const jaipur = { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' };
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena' || path === '/companies/me') {
        return { ...jaipur, coverUrl: 'https://cdn/cover.jpg', showcaseUrls: [] };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/team/members') return [];
      if (path === '/companies/seed-company-meena/collections') {
        return { results: [shopPack('col-1', 'One', jaipur)], nextCursor: null };
      }
      if (path === '/companies/seed-company-meena/designs') {
        return {
          results: [
            {
              id: 'd1',
              name: 'Red silk saree',
              images: ['https://cdn/d1.jpg'],
              rate: null,
              rateMax: null,
              unit: null,
              categories: [],
              postedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              company: jaipur,
            },
          ],
          nextCursor: null,
        };
      }
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/?tab=products']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('company-shop-tab-designs')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('business-profile-view-more')).toHaveAttribute(
      'href',
      '/more?tab=products',
    );
  });

  it('own collection more is manage/share, not Hide or Draft', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena' || path === '/companies/me') {
        return {
          ...company,
          id: 'seed-company-meena',
          name: 'Jaipur Emporium',
          coverUrl: 'https://cdn/cover.jpg',
          showcaseUrls: [],
        };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/companies/seed-company-meena/collections') {
        return {
          results: [
            {
              id: 'col-1',
              name: 'Wedding Edit',
              kind: 'regular',
              categories: [],
              memberFind: [],
              description: null,
              coverImage: 'https://cdn/p.jpg',
              previewImages: ['https://cdn/p.jpg'],
              imageCount: 1,
              productCount: 1,
              status: 'published',
              updatedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              orderPathPreference: null,
              rateMin: null,
              rateMax: null,
              rateUnit: null,
              exploreNewDesignCount: 0,
              showSourceShops: false,
              sourceShopNames: [],
              viewerReposted: false,
              company: { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' },
            },
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-meena/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const row = await screen.findByTestId('you-collection-row-col-1');
    fireEvent.pointerDown(row, { clientX: 220, clientY: 24, pointerId: 1 });
    fireEvent.pointerMove(row, { clientX: 40, clientY: 24, pointerId: 1 });
    fireEvent.pointerUp(row, { pointerId: 1 });
    fireEvent.click(screen.getByTestId('you-collection-swipe-more'));
    expect(await screen.findByTestId('owner-collection-more-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-share')).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-edit')).toBeInTheDocument();
    expect(screen.queryByTestId('collection-menu-message')).toBeNull();
    expect(screen.queryByTestId('collection-menu-draft')).toBeNull();
    expect(screen.queryByTestId('you-collection-hide')).toBeNull();
  });

  it('own Home collection tap opens the album with packManage', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena' || path === '/companies/me') {
        return {
          ...company,
          id: 'seed-company-meena',
          name: 'Jaipur Emporium',
          coverUrl: 'https://cdn/cover.jpg',
          showcaseUrls: [],
        };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/companies/seed-company-meena/collections') {
        return {
          results: [
            {
              id: 'col-1',
              name: 'Wedding Edit',
              kind: 'regular',
              categories: [],
              memberFind: [],
              description: null,
              coverImage: 'https://cdn/p.jpg',
              previewImages: ['https://cdn/p.jpg'],
              imageCount: 1,
              productCount: 1,
              status: 'published',
              updatedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              orderPathPreference: null,
              rateMin: null,
              rateMax: null,
              rateUnit: null,
              exploreNewDesignCount: 0,
              showSourceShops: false,
              sourceShopNames: [],
              viewerReposted: false,
              company: { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' },
            },
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-meena/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
            <Route path="/collections/:id" element={<AlbumLanded />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.click(await screen.findByTestId('you-collection-row-col-1'));
    expect(await screen.findByTestId('album-landed')).toHaveAttribute('data-pack-manage', '1');
  });

  it('does not show the shop trade dock on Home even with a traveling pick', async () => {
    writeBrowseAlbumPick([
      {
        collectionId: 'col-1',
        name: 'Wedding Edit',
        coverImage: null,
        companyId: 'seed-company-meena',
        companyName: 'Jaipur Emporium',
      },
    ]);
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena' || path === '/companies/me') {
        return {
          ...company,
          id: 'seed-company-meena',
          name: 'Jaipur Emporium',
          coverUrl: 'https://cdn/cover.jpg',
          showcaseUrls: [],
        };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/saved') return [];
      if (path === '/companies/seed-company-meena/collections') {
        return {
          results: [
            {
              id: 'col-1',
              name: 'Wedding Edit',
              kind: 'regular',
              categories: [],
              memberFind: [],
              description: null,
              coverImage: 'https://cdn/p.jpg',
              previewImages: ['https://cdn/p.jpg'],
              imageCount: 1,
              productCount: 1,
              status: 'published',
              updatedAt: '2026-01-01T00:00:00.000Z',
              allowForward: true,
              orderPathPreference: null,
              rateMin: null,
              rateMax: null,
              rateUnit: null,
              exploreNewDesignCount: 0,
              showSourceShops: false,
              sourceShopNames: [],
              viewerReposted: false,
              company: { ...company, id: 'seed-company-meena', name: 'Jaipur Emporium' },
            },
          ],
          nextCursor: null,
        };
      }
      if (path === '/companies/seed-company-meena/designs') {
        return { results: [], nextCursor: null };
      }
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('business-profile-home')).toBeInTheDocument();
    expect(screen.queryByTestId('company-shop-dock')).toBeNull();
    expect(screen.queryByTestId('company-shop-select')).toBeNull();
  });

  it('shows Add cover when own profile has no cover', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena') {
        return {
          ...company,
          id: 'seed-company-meena',
          name: 'Jaipur Emporium',
          coverUrl: null,
          showcaseUrls: ['https://cdn/s1.jpg'],
        };
      }
      if (path === '/connections') return [];
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
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('business-profile-add-cover')).toBeInTheDocument();
    expect(screen.queryByTestId('business-profile-cover-camera')).toBeNull();
    expect(screen.getByTestId('business-profile-view-showcase')).toHaveTextContent(
      'View Showcase ›',
    );
    expect(screen.queryByTestId('business-profile-showcase')).toBeNull();
  });
});


  it('View Showcase opens browse sheet then photo opens viewer', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('business-profile-view-showcase')).toBeInTheDocument();
    await user.click(screen.getByTestId('business-profile-view-showcase'));
    expect(await screen.findByTestId('showcase-browse-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('showcase-browse-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('photo-viewer')).toBeNull();
    await user.click(screen.getByTestId('showcase-browse-photo-0'));
    expect(await screen.findByTestId('photo-viewer')).toBeInTheDocument();
  });

  it('shows completeness nudge when logo missing; dismiss hides it', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
            <Route path="/settings/profile" element={<div data-testid="profile-edit" />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('profile-completeness-nudge')).toBeInTheDocument();
    expect(screen.getByTestId('profile-completeness-chip-logo')).toBeInTheDocument();
    expect(screen.getByTestId('profile-completeness-chip-logo').className).toMatch(/bg-chip-on/);
    expect(screen.getByTestId('profile-completeness-nudge').className).not.toMatch(/bg-foam/);
    await user.click(screen.getByTestId('profile-completeness-dismiss'));
    expect(screen.queryByTestId('profile-completeness-nudge')).toBeNull();
  });


  it('Add Showcase overlay opens empty browse with Add', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-meena' || path === '/companies/me') {
        return {
          ...company,
          id: 'seed-company-meena',
          name: 'Jaipur Emporium',
          coverUrl: 'https://cdn/cover.jpg',
          showcaseUrls: [],
          sellCategories: ['Silk'],
          buyCategories: [],
          gstNumber: null,
          contactPerson: 'Meena',
          contactPhone: null,
          showContactPhone: false,
          capabilities: { publish: true, relist: true, refer: true },
          tradePresence: { mill: false, trader: true, retailer: false },
          role: 'Owner',
          permissions: {
            uploads: true,
            chats: true,
            orders: true,
            payments: true,
            team: true,
          },
        };
      }
      if (path === '/connections') return [];
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
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<BusinessProfileBody companyId="seed-company-meena" variant="home" />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('business-profile-view-showcase')).toHaveTextContent(
      'Add Showcase ›',
    );
    await user.click(screen.getByTestId('business-profile-view-showcase'));
    expect(await screen.findByTestId('showcase-browse-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('showcase-add')).toBeInTheDocument();
    expect(screen.getByTestId('showcase-empty')).toBeInTheDocument();
  });

describe('CompanyProfilePage shop has no media cameras', () => {
  afterEach(() => {
    cleanup();
  });

  it('other shop cover is view-only with Showcase overlay when photos exist', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/seed-company-ravi') {
        return {
          ...company,
          coverUrl: 'https://cdn/cover.jpg',
          showcaseUrls: ['https://cdn/s1.jpg'],
        };
      }
      if (path === '/connections') return [];
      if (path === '/follows/following') return [];
      if (path === '/companies/seed-company-ravi/collections') {
        return { results: [], nextCursor: null };
      }
      if (path === '/companies/seed-company-ravi/designs') {
        return { results: [], nextCursor: null };
      }
      if (path === '/threads') return { results: [], nextCursor: null };
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/company/seed-company-ravi']}>
          <Routes>
            <Route path="/company/:id" element={<CompanyProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('business-profile-cover')).toBeInTheDocument();
    expect(screen.queryByTestId('business-profile-cover-camera')).toBeNull();
    expect(screen.queryByTestId('business-profile-avatar-camera')).toBeNull();
    expect(screen.getByTestId('business-profile-view-showcase')).toBeInTheDocument();
    expect(screen.queryByTestId('business-profile-showcase')).toBeNull();
    expect(screen.queryByTestId('business-profile-showcase-0')).toBeNull();
  });
});
