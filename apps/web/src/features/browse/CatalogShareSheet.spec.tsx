import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPLORE_BUSINESSES_SEARCH_HREF } from '@/features/explore/exploreDiscoveryHref';
import { CatalogShareSheet } from './CatalogShareSheet';
import { api, ApiError } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/apiClient')>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

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

describe('CatalogShareSheet share errors', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/settings') {
        return { tradeDefaults: { orderPathPreference: 'direct' } } as never;
      }
      if (path === '/threads') {
        return {
          results: [
            {
              id: 'thread-1',
              title: 'Jaipur Emporium',
              type: 'direct',
              visibility: 'shared',
              pinned: false,
              lastMessageAt: '2026-09-01T00:00:00.000Z',
              counterpart: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', logoUrl: null },
            },
          ],
          nextCursor: null,
        } as never;
      }
      throw new Error(`unexpected get ${path}`);
    });
  });

  it(
    'shows InlineNotice in the sheet when chat share fails',
    async () => {
      vi.mocked(api.post).mockRejectedValue(
        new ApiError({
          statusCode: 400,
          code: 'INVALID_REFERENCE',
          message: 'You can only share objects your business can access.',
        }),
      );

      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      renderSheet();

      await waitFor(() => {
        expect(screen.getByText('Jaipur Emporium')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Jaipur Emporium/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'You can only share objects your business can access.',
        );
      });
    },
    15_000,
  );
});
