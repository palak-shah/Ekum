import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderForBuyerSheet } from './OrderForBuyerSheet';
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

vi.mock('@/features/browse/useBrowseShortlist', () => ({
  useBrowseShortlist: () => ({ removeIds: vi.fn() }),
}));

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'meena' } }),
}));

function renderSheet(props?: {
  collectionId?: string;
  lines?: Array<{ productId: string; quantity: number; companyId?: string }>;
}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const lines = props?.lines ?? [{ productId: 'p1', quantity: 10 }];
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrderForBuyerSheet
          open
          onClose={() => {}}
          lines={lines}
          productIds={lines.map((line) => line.productId)}
          collectionId={props?.collectionId}
          onInvite={() => {}}
          onDone={() => {}}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('OrderForBuyerSheet', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/connections') return [];
      if (path === '/access-requests/outgoing') return [];
      if (path === '/search') return { results: [], nextCursor: null };
      if (path === '/trade-lanes') return [];
      throw new Error(`unexpected ${path}`);
    });
  });

  it('hides Not on Ekum yet until Find on Ekum misses', async () => {
    const user = userEvent.setup();
    renderSheet();

    expect(screen.queryByTestId('order-for-buyer-off-app')).toBeNull();
    expect(screen.getByLabelText('Find on Ekum')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Find on Ekum'), 'ZzNobody');

    await waitFor(() => {
      expect(screen.getByTestId('order-for-buyer-off-app')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Not on Ekum yet' })).toBeInTheDocument();
  });

  it('posts collectionId when logging from a pack', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/connections') {
        return [
          {
            id: 'cn1',
            status: 'active',
            createdAt: '2026-01-01',
            canPause: true,
            canResume: false,
            canBlock: true,
            canUnblock: false,
            company: {
              id: 'buyer',
              name: 'Surat Silk House',
              city: 'Surat',
              verification: 'none',
              logoUrl: null,
            },
          },
        ];
      }
      if (path === '/access-requests/outgoing') return [];
      if (path === '/search') return { results: [], nextCursor: null };
      if (path === '/trade-lanes') return [];
      throw new Error(`unexpected ${path}`);
    });
    vi.mocked(api.post).mockResolvedValue({
      order: { status: 'requested' },
      invitePath: null,
    });

    renderSheet({ collectionId: 'pack-je' });
    await user.click(await screen.findByText('Surat Silk House'));
    await user.click(screen.getByRole('button', { name: 'Log order' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/orders/for-buyer',
        expect.objectContaining({
          collectionId: 'pack-je',
          buyerCompanyId: 'buyer',
        }),
      );
    });
  });

  it('posts Direct mill lines then I-handle remainder for that buyer', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/connections') {
        return [
          {
            id: 'cn1',
            status: 'active',
            createdAt: '2026-01-01',
            canPause: true,
            canResume: false,
            canBlock: true,
            canUnblock: false,
            company: {
              id: 'buyer',
              name: 'Surat Silk House',
              city: 'Surat',
              verification: 'none',
              logoUrl: null,
            },
          },
        ];
      }
      if (path === '/access-requests/outgoing') return [];
      if (path === '/search') return { results: [], nextCursor: null };
      if (path === '/trade-lanes') {
        return [
          {
            sellerCompanyId: 'kavita',
            buyerCompanyId: 'buyer',
            ticket: 'mill',
            behaviors: { directOrder: true },
          },
        ];
      }
      throw new Error(`unexpected ${path}`);
    });
    vi.mocked(api.post).mockResolvedValue({
      order: { status: 'requested' },
      invitePath: null,
    });

    renderSheet({
      collectionId: 'pack-je',
      lines: [
        { productId: 'p1', quantity: 12, companyId: 'kavita' },
        { productId: 'p2', quantity: 12, companyId: 'ravi' },
      ],
    });
    await user.click(await screen.findByText('Surat Silk House'));
    await user.click(screen.getByRole('button', { name: 'Log order' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2);
    });
    expect(vi.mocked(api.post).mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        items: [{ productId: 'p1', quantity: 12 }],
      }),
    );
    expect(vi.mocked(api.post).mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        items: [{ productId: 'p2', quantity: 12 }],
      }),
    );
  });
});
