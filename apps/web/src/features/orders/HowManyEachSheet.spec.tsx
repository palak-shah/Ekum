import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ProductView } from '@ekum/domain-types';
import { describe, expect, it, vi } from 'vitest';
import { HowManyEachSheet } from './HowManyEachSheet';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn().mockRejectedValue(new Error('skip')) },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/tradePresence', () => ({
  useTradePresence: () => ({ selling: false, trading: false }),
}));

const product = {
  id: 'p1',
  name: 'Navy',
  images: [],
  companyId: 'c1',
  categories: [],
  unit: 'set',
  moq: null,
  rate: null,
  rateMax: null,
  piecesPerPack: 4,
} as ProductView;

function renderSheet() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
      <HowManyEachSheet
        open
        onClose={vi.fn()}
        sellerId="c1"
        products={[product]}
        onSendOrder={vi.fn()}
        onAskRates={vi.fn()}
      />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HowManyEachSheet line chrome', () => {
  it('puts sold-as beside the name and keeps note quiet until Add note', () => {
    renderSheet();
    expect(screen.getByText('Navy')).toBeInTheDocument();
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(screen.getByText('4 pcs')).toBeInTheDocument();
    expect(screen.getByTestId('how-many-add-note')).toBeInTheDocument();
    expect(screen.queryByTestId('how-many-note')).toBeNull();
  });
});
