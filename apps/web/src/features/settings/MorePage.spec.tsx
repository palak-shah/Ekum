import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MorePage } from './MorePage';

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    logout: vi.fn(),
    session: { user: { name: 'Ravi' } },
  }),
}));

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({
    data: {
      id: 'seed-company-ravi',
      name: 'Surat Silk House',
      city: 'Surat',
      contactPerson: 'Ravi',
      logoUrl: null,
      verification: 'gst_verified',
    },
  }),
}));

vi.mock('@/lib/tradePresence', () => ({
  useTradePresence: () => ({ buying: true, selling: true, trading: true, canPublish: true }),
}));

vi.mock('@/features/catalog/MyCatalogPage', () => ({
  MyCatalogPage: ({ embedded }: { embedded?: boolean }) =>
    embedded ? <div data-testid="you-library">Library</div> : null,
}));

vi.mock('@/features/company/CompanyShareSheet', () => ({
  CompanyShareSheet: () => null,
}));

describe('MorePage', () => {
  it('shows identity and library without a second title band', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <MorePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('you-identity')).toHaveTextContent('Surat Silk House');
    expect(screen.getByTestId('you-edit')).toBeInTheDocument();
    expect(screen.getByTestId('you-share')).toBeInTheDocument();
    expect(screen.queryByText(/Followers/i)).toBeNull();
    expect(screen.getByTestId('you-library')).toBeInTheDocument();
    expect(screen.queryByText('Buying')).toBeNull();
    expect(screen.queryByText('Selling')).toBeNull();
    expect(screen.queryByText('Can publish')).toBeNull();
    // Title + ⋯ live in AppShell — not a PageHeader on this page.
    expect(screen.queryByRole('heading', { name: 'You' })).toBeNull();
    expect(screen.queryByTestId('you-more')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
  });
});
