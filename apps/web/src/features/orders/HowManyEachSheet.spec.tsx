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
  sellerId?: string;
  productCompanyId?: string;
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
          sellerId={props?.sellerId ?? 'c1'}
          products={[{ ...product, companyId: props?.productCompanyId ?? 'c1' }]}
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
  it('keeps the name clean and shows a one-line note field', () => {
    renderSheet();
    const name = screen.getByText('Navy');
    expect(name).toBeInTheDocument();
    expect(name.className).not.toMatch(/truncate/);
    expect(screen.queryByText('Set')).toBeNull();
    expect(screen.queryByText('Metre')).toBeNull();
    expect(screen.queryByTestId('how-many-sold-as')).toBeNull();
    expect(screen.queryByTestId('how-many-add-note')).toBeNull();
    expect(screen.getByTestId('how-many-note')).toBeInTheDocument();
  });

  it('puts − n + on a qty row under the name so the title can wrap', () => {
    renderSheet();
    const row = screen.getByTestId('how-many-qty-row');
    expect(within(row).queryByText('Sets')).toBeNull();
    expect(within(row).getByRole('button', { name: /Increase/i })).toBeInTheDocument();
    const track = screen.getByTestId('qty-stepper');
    expect(track.className).toMatch(/bg-input/);
    expect(track.className).not.toMatch(/bg-foam/);
    expect(track.className).not.toMatch(/border/);
    expect(screen.getByTestId('how-many-unit-heading')).toHaveTextContent(
      'Order in Sets',
    );
    expect(screen.getByTestId('sheet-close').className).toMatch(/absolute/);
  });

  it('puts line × beside the product name, not on the qty row', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HowManyEachSheet
            open
            onClose={vi.fn()}
            sellerId="c1"
            products={[
              product,
              { ...product, id: 'p2', name: 'Ivory' },
            ]}
            onSendOrder={vi.fn()}
            onAskRates={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const line = screen.getAllByTestId('how-many-line')[0]!;
    expect(within(line).getByTestId('how-many-remove')).toBeInTheDocument();
    expect(within(line).getByTestId('how-many-qty-row').querySelector('[data-testid=how-many-remove]')).toBeNull();
    expect(screen.getByTestId('same-for-all-chip')).toBeInTheDocument();
    expect(screen.getByTestId('how-many-unit-heading')).toHaveTextContent(
      'Order in Sets',
    );
  });

  it('hides line × on whole-catalog members', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HowManyEachSheet
            open
            onClose={vi.fn()}
            sellerId="c1"
            products={[
              product,
              { ...product, id: 'p2', name: 'Ivory' },
            ]}
            lockedProductIds={['p1', 'p2']}
            onSendOrder={vi.fn()}
            onAskRates={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByTestId('how-many-remove')).toBeNull();
  });

  it('groups mixed units, restacks pack first, and hides Same for all', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HowManyEachSheet
            open
            onClose={vi.fn()}
            sellerId="c1"
            products={[
              { ...product, id: 'm1', name: 'Grey mill', unit: 'mtr', piecesPerPack: null },
              { ...product, id: 's1', name: 'Navy', unit: 'set', piecesPerPack: 12 },
              { ...product, id: 's2', name: 'Ivory', unit: 'set', piecesPerPack: 20 },
            ]}
            onSendOrder={vi.fn()}
            onAskRates={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const headings = screen.getAllByTestId('how-many-unit-heading');
    expect(headings.map((el) => el.textContent)).toEqual([
      'Order in Sets',
      'Order in Mtrs',
    ]);
    const names = screen.getAllByTestId('how-many-line').map(
      (line) => within(line).getAllByText(/Navy|Ivory|Grey mill/)[0]?.textContent,
    );
    expect(names).toEqual(['Navy', 'Ivory', 'Grey mill']);
    expect(screen.queryByTestId('same-for-all-chip')).toBeNull();
    expect(screen.getByText(/1 set = 20 pcs/)).toBeInTheDocument();
    expect(
      screen.getAllByTestId('how-many-qty-row').every((row) => !within(row).queryByText('Sets')),
    ).toBe(true);
  });

  it('opens Same for all seeded from the last typed line qty', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HowManyEachSheet
            open
            onClose={vi.fn()}
            sellerId="c1"
            products={[
              product,
              { ...product, id: 'p2', name: 'Ivory' },
            ]}
            onSendOrder={vi.fn()}
            onAskRates={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const navyQty = screen.getByRole('textbox', { name: /sets for Navy/i });
    await user.click(navyQty);
    await user.keyboard('{Control>}a{/Control}');
    await user.type(navyQty, '12');
    await user.click(screen.getByTestId('same-for-all-chip'));
    expect(
      screen.getByRole('textbox', { name: 'Same quantity for all designs' }),
    ).toHaveValue('12');
  });

  it('puts optional Transporter after the design lines (not in sticky footer)', () => {
    renderSheet();
    const extras = screen.getByTestId('how-many-extras');
    expect(within(extras).getByTestId('transporter-field')).toBeInTheDocument();
    expect(within(screen.getByTestId('how-many-footer')).queryByTestId('transporter-field')).toBeNull();
  });

  it('raises sheet max-height so the panel hugs toward the viewport', () => {
    renderSheet();
    const panel = document.querySelector('.ekum-sheet');
    expect(panel).toBeTruthy();
    expect(panel!.className).toMatch(/max-h-\[100dvh\]/);
    expect(screen.queryByTestId('sheet-full-scroll')).toBeNull();
  });

  it('order job: Place Order only — no Share or Ask rates; Order for buyer is a switch', () => {
    renderSheet({ sheetJob: 'order' });
    expect(screen.getByTestId('how-many-place-order')).toHaveTextContent('Place Order');
    expect(screen.getByTestId('how-many-order-for-buyer')).toBeInTheDocument();
    expect(screen.queryByTestId('how-many-share')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ask rates' })).toBeNull();
  });

  it('peer pack of my mill SKUs still shows Place Order', () => {
    renderSheet({ sheetJob: 'order', sellerId: 'jaipur', productCompanyId: 'me' });
    expect(screen.getByTestId('how-many-place-order')).toBeInTheDocument();
    expect(screen.queryByTestId('how-many-choose-buyer')).toBeNull();
  });

  it('own shop hides Place Order and leaves Order for buyer on', () => {
    renderSheet({ sheetJob: 'order', sellerId: 'me', productCompanyId: 'me' });
    expect(screen.queryByTestId('how-many-place-order')).toBeNull();
    expect(screen.getByTestId('how-many-order-for-buyer')).toBeInTheDocument();
  });

  it('ask job: Ask rates only', () => {
    renderSheet({ sheetJob: 'ask' });
    expect(screen.getByTestId('how-many-ask-rates')).toHaveTextContent('Ask rates');
    expect(screen.queryByTestId('how-many-place-order')).toBeNull();
    expect(screen.queryByTestId('how-many-order-for-buyer')).toBeNull();
    expect(screen.queryByTestId('how-many-share')).toBeNull();
  });

  it('Order for buyer on shows Choose buyer; does not auto-open picker', async () => {
    const user = userEvent.setup();
    renderSheet({ sheetJob: 'order' });
    await user.click(screen.getByRole('button', { name: /Increase/i }));
    await user.click(screen.getByTestId('how-many-order-for-buyer'));
    expect(screen.queryByRole('heading', { name: 'Order for buyer' })).toBeNull();
    expect(screen.getByTestId('how-many-choose-buyer')).toHaveTextContent('Choose buyer');
    await user.click(screen.getByTestId('how-many-choose-buyer'));
    expect(screen.getByRole('heading', { name: 'Order for buyer' })).toBeInTheDocument();
  });

  it('keeps sheet Note after lines, collapsed so designs stay the main job', () => {
    renderSheet();
    const extras = screen.getByTestId('how-many-extras');
    expect(within(extras).getByTestId('note-attach-add')).toHaveTextContent('Add note');
    expect(within(extras).queryByRole('textbox', { name: /note/i })).toBeNull();
    expect(within(extras).getByTestId('note-attach-plus')).toBeInTheDocument();
    expect(within(extras).getByTestId('transporter-field')).toHaveAttribute(
      'placeholder',
      'Transporter · optional',
    );
    expect(within(extras).getByTestId('how-many-order-for-buyer')).toBeInTheDocument();
    expect(within(screen.getByTestId('how-many-footer')).queryByTestId('note-attach-add')).toBeNull();
  });

  it('shows sheet-level Note with Voice · Photo tray above Transporter', async () => {
    const user = userEvent.setup();
    renderSheet();
    const extras = screen.getByTestId('how-many-extras');
    expect(within(extras).getByTestId('note-attach-plus')).toBeInTheDocument();
    expect(within(extras).getByTestId('transporter-field')).toBeInTheDocument();
    await user.click(within(extras).getByTestId('note-attach-plus'));
    expect(screen.getByTestId('note-attach-menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Voice/i })).toBeInTheDocument();
    expect(screen.getByTestId('note-attach-camera')).toBeInTheDocument();
    expect(screen.getByTestId('note-attach-gallery')).toBeInTheDocument();
  });

  it('passes common note fields on Place Order', async () => {
    const user = userEvent.setup();
    const { onSendOrder } = renderSheet();
    await user.click(screen.getByRole('button', { name: /Increase/i }));
    const extras = screen.getByTestId('how-many-extras');
    await user.click(within(extras).getByTestId('note-attach-add'));
    const sheetNote = within(extras).getAllByRole('textbox')[0]!;
    await user.type(sheetNote, 'Match sample');
    await user.click(screen.getByTestId('how-many-place-order'));
    expect(onSendOrder).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ productId: 'p1' })]),
      expect.objectContaining({ note: 'Match sample' }),
    );
  });

  it('whole catalog: one qty, read-only members, equal Place payload', async () => {
    const user = userEvent.setup();
    const onSendOrder = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const members = [
      {
        ...product,
        id: 'p1',
        name: 'Silk',
        unit: 'pc',
        piecesPerPack: null,
        rate: 450,
        catalogRateUnit: 'pc',
        catalogCollectionId: 'cat-1',
        catalogWhole: true,
        catalogName: 'Season',
      },
      {
        ...product,
        id: 'p2',
        name: 'Cotton',
        unit: 'pc',
        piecesPerPack: null,
        rate: 450,
        catalogRateUnit: 'pc',
        catalogCollectionId: 'cat-1',
        catalogWhole: true,
        catalogName: 'Season',
      },
    ] as ProductView[];
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HowManyEachSheet
            open
            onClose={vi.fn()}
            sellerId="catalog-shop"
            products={members}
            onSendOrder={onSendOrder}
            onAskRates={vi.fn()}
            lockedProductIds={['p1', 'p2']}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Season' })).toBeInTheDocument();
    expect(screen.getByTestId('how-many-catalog')).toBeInTheDocument();
    expect(screen.getAllByTestId('qty-stepper')).toHaveLength(1);
    expect(screen.queryByTestId('same-for-all-chip')).toBeNull();
    expect(screen.queryByTestId('how-many-remove')).toBeNull();
    expect(screen.queryByTestId('how-many-add-note')).toBeNull();
    const membersList = screen.getByTestId('how-many-catalog-members');
    expect(within(membersList).getByText('Silk')).toBeInTheDocument();
    expect(within(membersList).getByText('Cotton')).toBeInTheDocument();
    expect(within(membersList).queryByRole('textbox')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Increase/i }));
    await user.click(screen.getByTestId('how-many-place-order'));
    const payload = onSendOrder.mock.calls[0]?.[0] as Array<{ productId: string; quantity: number }>;
    expect(payload).toEqual([
      expect.objectContaining({ productId: 'p1', quantity: 1 }),
      expect.objectContaining({ productId: 'p2', quantity: 1 }),
    ]);
  });

});
