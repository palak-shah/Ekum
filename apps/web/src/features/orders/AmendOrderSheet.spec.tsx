import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { OrderItemView } from '@ekum/domain-types';
import { OrderLineStatus } from '@ekum/domain-types';
import { describe, expect, it, vi } from 'vitest';
import { AmendOrderSheet } from './AmendOrderSheet';

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function item(partial: Partial<OrderItemView> & Pick<OrderItemView, 'id' | 'productId' | 'name'>): OrderItemView {
  return {
    sku: null,
    rate: 40,
    unit: 'set',
    dispatchUnit: 'pc',
    piecesPerPack: 4,
    image: null,
    images: [],
    quantity: 2,
    requestedQuantity: 2,
    lineStatus: OrderLineStatus.Open,
    shippedQuantity: 0,
    remainingQuantity: 2,
    note: null,
    ...partial,
  };
}

function renderSheet(
  items: OrderItemView[],
  qty: Record<string, string> = Object.fromEntries(
    items.filter((row) => row.productId).map((row) => [row.productId!, String(row.quantity)]),
  ),
) {
  const onSave = vi.fn();
  const onQty = vi.fn();
  render(
    <AmendOrderSheet
      open
      onClose={vi.fn()}
      title="Edit order"
      items={items}
      qty={qty}
      onQty={onQty}
      removed={new Set()}
      onToggleRemoved={vi.fn()}
      lineNotes={{}}
      onLineNote={vi.fn()}
      transporter=""
      onTransporter={vi.fn()}
      note=""
      onNote={vi.fn()}
      voice={null}
      onVoice={vi.fn()}
      images={[]}
      onImages={vi.fn()}
      onSave={onSave}
      onOpenPhoto={vi.fn()}
    />,
  );
  return { onSave, onQty };
}

describe('AmendOrderSheet How many chrome', () => {
  it('puts − n + under the name with no Sets on the row; footer holds units and ₹', () => {
    renderSheet([
      item({ id: 'i1', productId: 'p1', name: 'Navy', quantity: 2, piecesPerPack: 4, rate: 40 }),
    ]);
    const row = screen.getByTestId('how-many-qty-row');
    expect(within(row).queryByText('Sets')).toBeNull();
    expect(within(row).getByRole('button', { name: /Increase/i })).toBeInTheDocument();
    expect(screen.getByTestId('how-many-unit-heading')).toHaveTextContent(
      'Order in Sets',
    );
    const footer = screen.getByTestId('order-amend-footer');
    expect(within(footer).getByTestId('how-many-sets-summary')).toHaveTextContent('2 sets = 8 pcs');
    expect(within(footer).getByTestId('how-many-billing-total')).toHaveTextContent('₹320');
    expect(within(footer).getByTestId('order-amend-save')).toBeInTheDocument();
  });

  it('groups mixed units and hides per-line unit captions', () => {
    renderSheet([
      item({
        id: 'i2',
        productId: 'p2',
        name: 'Grey mill',
        unit: 'mtr',
        dispatchUnit: 'mtr',
        piecesPerPack: null,
        quantity: 70,
        rate: 55,
      }),
      item({ id: 'i1', productId: 'p1', name: 'Navy', unit: 'set', piecesPerPack: 12, quantity: 2, rate: 10 }),
    ]);
    expect(screen.getAllByTestId('how-many-unit-heading').map((el) => el.textContent)).toEqual([
      'Order in Sets',
      'Order in Mtrs',
    ]);
    const names = screen.getAllByTestId('order-amend-line').map(
      (line) => within(line).getByText(/Navy|Grey mill/).textContent,
    );
    expect(names).toEqual(['Navy', 'Grey mill']);
    expect(
      screen.getAllByTestId('how-many-qty-row').every((row) => !within(row).queryByText('Sets')),
    ).toBe(true);
    const footer = screen.getByTestId('order-amend-footer');
    expect(footer).toHaveTextContent('2 sets = 24 pcs');
    expect(footer).toHaveTextContent('70 mtrs');
    expect(screen.queryByTestId('same-for-all-chip')).toBeNull();
  });

  it('shows Same for all on top when remaining lines share one unit', async () => {
    const user = userEvent.setup();
    const { onQty } = renderSheet([
      item({
        id: 'i1',
        productId: 'p1',
        name: 'Chiffon Roll',
        unit: 'mtr',
        dispatchUnit: 'mtr',
        piecesPerPack: null,
        quantity: 10,
        rate: 128,
      }),
      item({
        id: 'i2',
        productId: 'p2',
        name: 'Organza Base',
        unit: 'mtr',
        dispatchUnit: 'mtr',
        piecesPerPack: null,
        quantity: 10,
        rate: 160,
      }),
    ]);
    const chip = screen.getByTestId('same-for-all-chip');
    expect(chip).toHaveTextContent('Same for all');
    const lines = screen.getByTestId('order-amend-lines');
    expect(chip.compareDocumentPosition(lines) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(chip);
    expect(
      screen.getByRole('textbox', { name: 'Same quantity for all designs' }),
    ).toHaveValue('10');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onQty).toHaveBeenCalledWith('p1', 10);
    expect(onQty).toHaveBeenCalledWith('p2', 10);
  });

  it('puts × beside the name, not on the qty row', () => {
    renderSheet([
      item({ id: 'i1', productId: 'p1', name: 'Navy' }),
      item({ id: 'i2', productId: 'p2', name: 'Ivory' }),
    ]);
    const line = screen.getAllByTestId('order-amend-line')[0]!;
    expect(within(line).getByTestId('order-amend-remove')).toBeInTheDocument();
    expect(
      within(line).getByTestId('how-many-qty-row').querySelector('[data-testid=order-amend-remove]'),
    ).toBeNull();
  });

  it('hides footer ₹ when a remaining line has no rate', () => {
    renderSheet([
      item({ id: 'i1', productId: 'p1', name: 'Navy', rate: 40, quantity: 2, piecesPerPack: 4 }),
      item({ id: 'i2', productId: 'p2', name: 'Ivory', rate: null, quantity: 1, piecesPerPack: 4 }),
    ]);
    expect(screen.getByTestId('how-many-sets-summary')).toHaveTextContent('3 sets = 12 pcs');
    expect(screen.queryByTestId('how-many-billing-total')).toBeNull();
  });
});
