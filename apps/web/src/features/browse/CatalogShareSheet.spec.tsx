import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPLORE_BUSINESSES_SEARCH_HREF } from '@/features/explore/exploreDiscoveryHref';
import { CatalogShareSheet } from './CatalogShareSheet';
import { api, ApiError } from '@/lib/apiClient';
import type { ConnectionView } from '@ekum/domain-types';

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

const jaipur: ConnectionView = {
  id: 'conn-1',
  role: 'viewer',
  status: 'active',
  createdAt: '2026-09-01T00:00:00.000Z',
  company: {
    id: 'c1',
    name: 'Jaipur Emporium',
    city: 'Jaipur',
    verification: 'none',
    logoUrl: null,
  },
};

const ahmedabad: ConnectionView = {
  id: 'conn-2',
  role: 'viewer',
  status: 'active',
  createdAt: '2026-09-01T00:00:00.000Z',
  company: {
    id: 'c2',
    name: 'Ahmedabad Cloth company',
    city: 'Ahmedabad',
    verification: 'none',
    logoUrl: null,
  },
};

function renderSheet(connections: ConnectionView[] = [jaipur, ahmedabad]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(api.get).mockImplementation(async (path: string) => {
    if (path === '/connections') return connections as never;
    if (path === '/access-requests/outgoing') return [] as never;
    if (path === '/settings') {
      return { tradeDefaults: { orderPathPreference: 'direct' } } as never;
    }
    throw new Error(`unexpected get ${path}`);
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
    vi.clearAllMocks();
  });

  it('shows Find on Ekum, Find in Explore, and 48h link when there are no connections', async () => {
    renderSheet([]);

    await waitFor(() => {
      expect(screen.getByLabelText('Find on Ekum')).toBeInTheDocument();
    });

    const link = screen.getByTestId('find-in-explore-link');
    expect(link).toHaveAttribute('href', EXPLORE_BUSINESSES_SEARCH_HREF);
    expect(screen.getByTestId('catalog-share-link')).toHaveTextContent(/Copy a link · 48 hours/i);
  });
});

describe('CatalogShareSheet multi-select share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts into each selected company chat and never calls broadcast', async () => {
    vi.mocked(api.post).mockImplementation(async (path: string, body?: unknown) => {
      if (path === '/threads/direct') {
        const companyId = (body as { companyId: string }).companyId;
        return { id: `thread-${companyId}` } as never;
      }
      if (String(path).includes('/messages')) return { id: 'm1' } as never;
      throw new Error(`unexpected post ${path}`);
    });

    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Jaipur Emporium')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Jaipur Emporium/i }));
    await user.click(screen.getByRole('button', { name: /Ahmedabad Cloth company/i }));
    expect(screen.getByTestId('catalog-share-clear')).toBeInTheDocument();

    await user.click(screen.getByTestId('catalog-share-send'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/threads/direct', { companyId: 'c1' });
      expect(api.post).toHaveBeenCalledWith('/threads/direct', { companyId: 'c2' });
      expect(api.post).toHaveBeenCalledWith(
        '/threads/thread-c1/messages',
        expect.objectContaining({ referenceId: 'col1', body: 'Monsoon' }),
      );
      expect(api.post).toHaveBeenCalledWith(
        '/threads/thread-c2/messages',
        expect.objectContaining({ referenceId: 'col1', body: 'Monsoon' }),
      );
    });
    expect(vi.mocked(api.post).mock.calls.some(([path]) => String(path).includes('/broadcasts'))).toBe(
      false,
    );
  });

  it('clears the selection', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Jaipur Emporium')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Jaipur Emporium/i }));
    expect(screen.getByText(/1 selected/)).toBeInTheDocument();
    await user.click(screen.getByTestId('catalog-share-clear'));
    expect(screen.getByText(/0 selected/)).toBeInTheDocument();
    expect(screen.queryByTestId('catalog-share-clear')).toBeNull();
  });

  it('shows InlineNotice when chat share fails', async () => {
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
    await user.click(screen.getByTestId('catalog-share-send'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'You can only share objects your business can access.',
      );
    });
  }, 15_000);
});
