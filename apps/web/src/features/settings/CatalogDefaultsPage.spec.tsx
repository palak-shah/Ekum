import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogDefaultsPage } from './CatalogDefaultsPage';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(async () => ({
      tradeDefaults: {},
    })),
    put: vi.fn(async () => ({})),
    patch: vi.fn(async () => ({ ok: true, demoted: 0 })),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('CatalogDefaultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Rate per defaulting to pc when settings never saved sell-as', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <CatalogDefaultsPage />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('catalog-defaults-rate-unit')).toHaveAttribute(
        'data-value',
        'pc',
      );
    });
    expect(screen.getByLabelText('Rate unit')).toBeTruthy();
  });

  it('exposes shop-wide Repost Pack control', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <CatalogDefaultsPage />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('shop-repost-pack-toggle')).toBeChecked();
    });
    expect(screen.getByTestId('shop-repost-pack-section')).toBeTruthy();
  });
});
