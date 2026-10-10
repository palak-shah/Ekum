import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
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

function renderSheet(props?: {
  sheetJob?: 'order' | 'ask';
  onSendOrder?: ReturnType<typeof vi.fn>;
}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onSendOrder = props?.onSendOrder ?? vi.fn();
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HowManyEachSheet
          open
          onClose={vi.fn()}
          sellerId="c1"
          products={[product]}
          onSendOrder={onSendOrder}
          onAskRates={vi.fn()}
          sheetJob={props?.sheetJob ?? 'order'}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, onSendOrder };
}

describe('HowManyEachSheet line chrome', () => {
  it('puts sold-as beside the name and shows a one-line note field', () => {
    renderSheet();
    expect(screen.getByText('Navy')).toBeInTheDocument();
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(screen.getByText('4 pcs')).toBeInTheDocument();
    expect(screen.queryByTestId('how-many-add-note')).toBeNull();
    expect(screen.getByTestId('how-many-note')).toBeInTheDocument();
  });

  it('shows optional Transporter in the footer', () => {
    renderSheet();
    expect(screen.getByTestId('transporter-field')).toBeInTheDocument();
  });

  it('raises sheet max-height like Share so the panel hugs toward the viewport', () => {
    renderSheet();
    const panel = document.querySelector('.ekum-sheet');
    expect(panel).toBeTruthy();
    expect(panel!.className).toMatch(/max-h-\[min\(92dvh,100dvh\)\]/);
    expect(screen.queryByTestId('sheet-full-scroll')).toBeNull();
  });

  it('order job: Place Order only — no Share or Ask rates; Order for buyer is a switch', () => {
    renderSheet({ sheetJob: 'order' });
    expect(screen.getByTestId('how-many-place-order')).toHaveTextContent('Place Order');
    expect(screen.getByTestId('how-many-order-for-buyer')).toBeInTheDocument();
    expect(screen.queryByTestId('how-many-share')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ask rates' })).toBeNull();
  });

  it('ask job: Ask rates only', () => {
    renderSheet({ sheetJob: 'ask' });
    expect(screen.getByTestId('how-many-ask-rates')).toHaveTextContent('Ask rates');
    expect(screen.queryByTestId('how-many-place-order')).toBeNull();
    expect(screen.queryByTestId('how-many-order-for-buyer')).toBeNull();
    expect(screen.queryByTestId('how-many-share')).toBeNull();
  });

  it('Order for buyer switch opens the buyer sheet', async () => {
    const user = userEvent.setup();
    renderSheet({ sheetJob: 'order' });
    await user.click(screen.getByRole('button', { name: /Increase/i }));
    await user.click(screen.getByTestId('how-many-order-for-buyer'));
    expect(screen.getByRole('heading', { name: 'Order for buyer' })).toBeInTheDocument();
  });

  it('shows sheet-level Note with Voice · Photo tray above Transporter', async () => {
    const user = userEvent.setup();
    renderSheet();
    expect(screen.getByTestId('note-attach-plus')).toBeInTheDocument();
    expect(screen.getByTestId('transporter-field')).toBeInTheDocument();
    await user.click(screen.getByTestId('note-attach-plus'));
    expect(screen.getByTestId('note-attach-menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Voice/i })).toBeInTheDocument();
    expect(screen.getByTestId('note-attach-camera')).toBeInTheDocument();
    expect(screen.getByTestId('note-attach-gallery')).toBeInTheDocument();
  });

  it('passes common note fields on Place Order', async () => {
    const user = userEvent.setup();
    const { onSendOrder } = renderSheet();
    await user.click(screen.getByRole('button', { name: /Increase/i }));
    const footer = screen.getByTestId('how-many-footer');
    const sheetNote = within(footer).getAllByRole('textbox')[0]!;
    await user.type(sheetNote, 'Match sample');
    await user.click(screen.getByTestId('how-many-place-order'));
    expect(onSendOrder).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ productId: 'p1' })]),
      expect.objectContaining({ note: 'Match sample' }),
    );
  });

});
