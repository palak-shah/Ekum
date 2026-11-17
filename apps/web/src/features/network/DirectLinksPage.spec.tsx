import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DirectLinksPage, PathLockedDefaults } from './DirectLinksPage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn(), post: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'trader' } }),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DirectLinksPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Direct links locked defaults', () => {
  it('shows mill ticket, group, and auto-repost as On, not toggles', () => {
    render(<PathLockedDefaults testIdPrefix="path-1" />);
    expect(screen.getByTestId('path-1-direct-order')).toHaveTextContent('Direct supplier orders');
    expect(screen.getByTestId('path-1-group')).toHaveTextContent('share a group');
    expect(screen.getByTestId('path-1-auto-repost')).toHaveTextContent(
      'New supplier posts go to this buyer',
    );
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('does not show ticket/reveal switches', () => {
    render(<PathLockedDefaults testIdPrefix="path-1" />);
    expect(screen.queryByText(/Buyer talks to/i)).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
  });
});

const lane = {
  id: 'lane-1',
  traderCompanyId: 'trader',
  sellerCompanyId: 'mill',
  buyerCompanyId: 'buyer',
  sellerName: 'Ahmedabad Loom Co',
  buyerName: 'Jaipur Emporium',
  ticket: 'mill' as const,
  reveal: true,
  behaviors: { directOrder: true, autoRepost: false },
  behaviorsEditable: false,
  shareActive: true,
  updatedAt: new Date('2026-10-28').toISOString(),
};

describe('Direct links list', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/trade-lanes') return [lane];
      return [];
    });
  });

  it('lists supplier and buyer in one row with a red delete icon', async () => {
    renderPage();
    const row = await screen.findByTestId('path-row-lane-1');
    expect(screen.getByTestId('direct-links-table')).toBeInTheDocument();
    expect(row).toHaveTextContent('Ahmedabad Loom Co');
    expect(row).toHaveTextContent('Jaipur Emporium');
    const remove = screen.getByTestId('path-remove-lane-1');
    expect(remove).toHaveAccessibleName('Remove Direct link');
    expect(remove).not.toHaveTextContent('Remove');
    expect(remove.className).toMatch(/text-danger/);
    expect(screen.queryByTestId('path-lane-1-direct-order')).toBeNull();
    expect(screen.queryByTestId('path-lane-1-group')).toBeNull();
    expect(screen.queryByTestId('path-lane-1-auto-repost')).toBeNull();
  });
});

describe('Direct links create sheet', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/trade-lanes') return [];
      if (path === '/follows/following') return [];
      if (path === '/follows/followers') return [];
      return [];
    });
  });

  it('labels the mill picker Supplier, not Mill', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('paths-new'));
    expect(await screen.findByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('Follow a supplier on their shop first.')).toBeInTheDocument();
    expect(screen.queryByText('Mill')).toBeNull();
    expect(screen.queryByText(/Follow a mill/i)).toBeNull();
    expect(screen.getByTestId('paths-create-auto-repost')).toHaveTextContent(
      'New supplier posts go to this buyer',
    );
  });

  it('shows Ask to repost instead of Select when the mill has not granted Repost', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/trade-lanes') return [];
      if (path === '/follows/following') {
        return [
          {
            id: 'mill-look',
            name: 'Surat Silk House',
            city: 'Surat',
            verification: 'none',
            logoUrl: null,
            sellCategories: [],
            buyCategories: [],
            accessKind: 'look',
            packAskPending: false,
          },
        ];
      }
      if (path === '/follows/followers') return [];
      return [];
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('paths-new'));
    const ask = await screen.findByRole('button', { name: 'Ask to repost' });
    expect(ask.className).toMatch(/bg-accent/);
    expect(ask.className).toMatch(/h-8/);
    expect(screen.queryByText('Select')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Ask to repost' }));
    expect(api.post).toHaveBeenCalledWith('/follows/share-ask', { companyId: 'mill-look' });
  });
});

describe('Direct links gray when Repost is off', () => {
  it('mutes the row and offers Ask to repost', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/trade-lanes') return [{ ...lane, shareActive: false }];
      if (path === '/follows/following') {
        return [
          {
            id: 'mill',
            name: 'Ahmedabad Loom Co',
            city: 'Ahmedabad',
            verification: 'none',
            logoUrl: null,
            sellCategories: [],
            buyCategories: [],
            accessKind: 'look',
            packAskPending: false,
          },
        ];
      }
      return [];
    });
    renderPage();
    const row = await screen.findByTestId('path-row-lane-1');
    expect(row.querySelector('.text-muted')).toBeTruthy();
    expect(screen.getByTestId('path-why-off-lane-1')).toHaveTextContent('Repost off');
    const ask = screen.getByTestId('path-request-share-lane-1');
    expect(ask).toHaveTextContent('Ask to repost');
    expect(ask.className).toMatch(/bg-accent/);
    expect(ask.className).toMatch(/h-8/);
  });

  it('opens remove confirm before deleting', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/trade-lanes') return [{ ...lane, shareActive: false }];
      return [];
    });
    renderPage();
    await user.click(await screen.findByTestId('path-remove-lane-1'));
    expect(await screen.findByText('Remove Direct link?')).toBeInTheDocument();
    expect(screen.getByTestId('direct-link-remove-continue')).toBeInTheDocument();
  });
});

describe('Direct links buyer picker filters', () => {
  it('lists followers only and hides self plus suppliers', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/trade-lanes') return [];
      if (path === '/follows/following') {
        return [
          {
            id: 'mill',
            name: 'Ahmedabad Loom Co',
            city: 'Ahmedabad',
            verification: 'none',
            logoUrl: null,
            sellCategories: [],
            buyCategories: [],
            accessKind: 'pack',
            packAskPending: false,
          },
          {
            id: 'dual',
            name: 'Surat Silk House',
            city: 'Surat',
            verification: 'none',
            logoUrl: null,
            sellCategories: [],
            buyCategories: [],
            accessKind: 'pack',
            packAskPending: false,
          },
        ];
      }
      if (path === '/follows/followers') {
        return [
          {
            company: {
              id: 'buyer',
              name: 'Jaipur Emporium',
              city: 'Jaipur',
              verification: 'none',
              logoUrl: null,
            },
            accessKind: 'look',
            stopped: false,
            createdAt: '2026-01-01',
          },
          {
            company: {
              id: 'dual',
              name: 'Surat Silk House',
              city: 'Surat',
              verification: 'none',
              logoUrl: null,
            },
            accessKind: 'look',
            stopped: false,
            createdAt: '2026-01-01',
          },
          {
            company: {
              id: 'trader',
              name: 'Me',
              city: 'Surat',
              verification: 'none',
              logoUrl: null,
            },
            accessKind: 'look',
            stopped: false,
            createdAt: '2026-01-01',
          },
        ];
      }
      return [];
    });
    renderPage();
    await user.click(screen.getByTestId('paths-new'));
    expect(await screen.findByText('Jaipur Emporium')).toBeInTheDocument();
    // Dual-role Surat stays under Supplier only — not also as Buyer.
    expect(screen.getAllByText('Surat Silk House')).toHaveLength(1);
    expect(screen.queryByText('Me')).toBeNull();
  });
});
