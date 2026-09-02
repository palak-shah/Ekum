import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPLORE_BUSINESSES_SEARCH_HREF } from '@/features/explore/exploreDiscoveryHref';
import { CatalogShareSheet } from './CatalogShareSheet';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/shareInvite', () => ({
  canNativeShare: () => false,
  catalogShareCopy: () => ({ title: 't', text: 'x' }),
  shareOrCopyInvite: vi.fn(),
}));

function renderSheet() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CatalogShareSheet
          open
          onClose={() => {}}
          collections={[{ collectionId: 'col1', name: 'Monsoon' }]}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CatalogShareSheet empty network', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/settings') {
        return { tradeDefaults: { orderPathPreference: 'direct' } } as never;
      }
      if (path === '/threads') {
        return { results: [], nextCursor: null } as never;
      }
      throw new Error(`unexpected get ${path}`);
    });
  });

  it('shows Find in Explore and 48h link when there are no chats', async () => {
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('No chats yet')).toBeInTheDocument();
    });

    const link = screen.getByTestId('find-in-explore-link');
    expect(link).toHaveAttribute('href', EXPLORE_BUSINESSES_SEARCH_HREF);
    expect(screen.getByRole('button', { name: /Copy a link · 48 hours/i })).toBeInTheDocument();
  });
});
