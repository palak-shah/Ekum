import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ProductView } from '@ekum/domain-types';
import { describe, expect, it, vi } from 'vitest';
import { HowManyEachSheet } from './HowManyEachSheet';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn().mockImplementation(async (path: string) => {
      if (path === '/connections') return [];
      throw new Error('skip');
    }),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/tradePresence', () => ({
  useTradePresence: () => ({ selling: true, trading: true }),
}));

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me' } }),
}));

vi.mock('@/features/voice/NoteAttachField', () => ({
  NoteAttachField: ({
    onBusyChange,
  }: {
    onBusyChange?: (busy: boolean) => void;
  }) => (
    <button type="button" data-testid="mock-attach-busy" onClick={() => onBusyChange?.(true)}>
      Mark busy
    </button>
  ),
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

describe('HowManyEachSheet attach busy gate', () => {
  it('disables Place while note attach reports busy', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HowManyEachSheet
            open
            onClose={vi.fn()}
            sellerId="c1"
            products={[product]}
            onSendOrder={vi.fn()}
            onAskRates={vi.fn()}
            sheetJob="order"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Increase/i }));
    expect(screen.getByTestId('how-many-place-order')).toBeEnabled();
    await user.click(screen.getByTestId('mock-attach-busy'));
    expect(screen.getByTestId('how-many-place-order')).toBeDisabled();
  });
});
