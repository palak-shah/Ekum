import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { SavedItemView } from '@ekum/domain-types';
import { SavedPage } from './SavedPage';

const item: SavedItemView = {
  id: 'saved-1',
  kind: 'product',
  productId: 'prod-1',
  company: {
    id: 'c-meena',
    name: 'Jaipur Emporium',
    city: 'Jaipur',
    logoUrl: null,
    verification: 'unverified',
  },
  name: 'Bandhani georgette',
  thumbUrl: null,
  images: [],
  sku: 'EK-1',
  rate: 280,
  unit: 'mtr',
  createdAt: '2026-01-01T00:00:00.000Z',
  savedBy: { id: 'u-ravi', name: 'Ravi' },
};

vi.mock('./useSaveToggle', () => ({
  SAVED_QUERY_KEY: ['saved'],
  useSavedList: () => ({
    isLoading: false,
    isError: false,
    data: [item],
    refetch: vi.fn(),
  }),
}));

vi.mock('@/lib/auth', () => ({
  useCompanyId: () => 'seed-company-ravi',
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('SavedPage feed', () => {
  it('renders bookmarked design meta without crashing (default feed layout)', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <SavedPage embedded hideKindTabs kind="designs" layout="feed" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Bandhani georgette')).toBeTruthy();
    expect(screen.getByText('Jaipur Emporium · EK-1 · ₹280/mtr')).toBeTruthy();
  });
});
