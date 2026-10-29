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
    expect(screen.getByText('Follow a supplier first.')).toBeInTheDocument();
    expect(screen.queryByText('Mill')).toBeNull();
    expect(screen.queryByText(/Follow a mill/i)).toBeNull();
    expect(screen.getByTestId('paths-create-auto-repost')).toHaveTextContent(
      'New supplier posts go to this buyer',
    );
  });
});
