import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { OrderItemView } from '@ekum/domain-types';
import { OrderLineFulfillExpand } from './OrderLineFulfillExpand';

function item(partial: Partial<OrderItemView> = {}): OrderItemView {
  return {
    id: 'oi1',
    productId: null,
    name: 'Cotton Dress Material',
    sku: 'EK-1',
    rate: 640,
    unit: 'set',
    image: null,
    images: [],
    quantity: 20,
    requestedQuantity: 20,
    remainingQuantity: 20,
    shippedQuantity: 0,
    lineStatus: 'confirmed',
    note: null,
    ...partial,
  };
}

const base = {
  canEdit: true,
  photo: <span>thumb</span>,
  onToggle: vi.fn(),
  onCantSupply: vi.fn(),
  onSaveQty: vi.fn(),
};

describe('OrderLineFulfillExpand', () => {
  it('shows edit icon · fact strip · Ordered qty — no Last LR / Ship now / Dispatch', () => {
    const onSaveQty = vi.fn();
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        expanded
        onSaveQty={onSaveQty}
      />,
    );
    expect(screen.getByTestId('order-line-facts')).toBeTruthy();
    expect(screen.getByTestId('order-line-fact-qty')).toHaveTextContent('20');
    expect(screen.getByTestId('order-line-fact-shipped')).toHaveTextContent('15');
    expect(screen.getByTestId('order-line-fact-balance')).toHaveTextContent('-5');
    expect(screen.queryByTestId('order-line-fact-pending')).toBeNull();
    expect(screen.queryByText('Last LR')).toBeNull();
    expect(screen.queryByTestId('order-line-last-lr-qty')).toBeNull();
    expect(screen.queryByTestId('order-line-ship-now')).toBeNull();
    expect(screen.queryByTestId('order-line-dispatch')).toBeNull();
    expect((screen.getByTestId('order-line-ordered-qty') as HTMLInputElement).value).toBe('20');
    fireEvent.change(screen.getByTestId('order-line-ordered-qty'), { target: { value: '16' } });
    fireEvent.click(screen.getByTestId('order-line-qty-save'));
    expect(onSaveQty).toHaveBeenCalledWith(16);
  });

  it('blocks Ordered below shipped', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        expanded
      />,
    );
    fireEvent.change(screen.getByTestId('order-line-ordered-qty'), { target: { value: '10' } });
    expect(screen.getByText('Can’t go below shipped.')).toBeTruthy();
    expect(screen.queryByTestId('order-line-qty-save')).toBeNull();
  });

  it('opens expand from the pencil only — not the row body', () => {
    const onToggle = vi.fn();
    render(
      <OrderLineFulfillExpand
        {...base}
        onToggle={onToggle}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        expanded={false}
      />,
    );
    expect(screen.getByTestId('order-line-edit-icon')).toBeTruthy();
    expect(screen.queryByTestId('order-line-toggle')).toBeNull();
    fireEvent.click(screen.getByText('Cotton Dress Material'));
    expect(onToggle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('order-line-edit-icon'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows a quiet close control when expanded', () => {
    const onToggle = vi.fn();
    render(
      <OrderLineFulfillExpand
        {...base}
        onToggle={onToggle}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        expanded
      />,
    );
    expect(screen.queryByTestId('order-line-edit-icon')).toBeNull();
    fireEvent.click(screen.getByTestId('order-line-close-edit'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keeps Ordered draft when parent re-renders', () => {
    const { rerender } = render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        expanded
      />,
    );
    fireEvent.change(screen.getByTestId('order-line-ordered-qty'), { target: { value: '18' } });
    rerender(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        expanded
      />,
    );
    expect((screen.getByTestId('order-line-ordered-qty') as HTMLInputElement).value).toBe('18');
  });

  it('still allows Ordered raise after the line is complete', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 20, remainingQuantity: 0 })}
        expanded
      />,
    );
    expect(screen.getByTestId('order-line-ordered-qty')).toBeTruthy();
    expect(screen.queryByTestId('order-line-ship-now')).toBeNull();
    expect(screen.queryByTestId('order-line-dispatch')).toBeNull();
  });

  it('shows line note in warning highlight when collapsed', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ note: 'iska Chota than' })}
        expanded={false}
      />,
    );
    const note = screen.getByTestId('order-line-note');
    expect(note).toHaveTextContent('iska Chota than');
    expect(note.className).toContain('text-warning-ink');
    expect(note.className).not.toContain('text-muted');
  });

  it('hides Can’t supply toggle on grayed collapsed row — cue only', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ lineStatus: 'declined', remainingQuantity: 0, shippedQuantity: 20 })}
        expanded={false}
      />,
    );
    expect(screen.queryByTestId('order-line-cant-supply-toggle')).toBeNull();
    expect(screen.getByTestId('order-line-cant-supply-cue')).toHaveTextContent('Can’t supply');
    const stack = screen.getByTestId('order-line-stack');
    expect(stack.querySelector('.opacity-50')).toBeTruthy();
  });

  it('keeps Can’t supply switch only when expanded to edit', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ lineStatus: 'declined', remainingQuantity: 0 })}
        expanded
      />,
    );
    expect(screen.getByTestId('order-line-cant-supply-toggle')).toBeTruthy();
    expect(screen.queryByTestId('order-line-ordered-qty')).toBeNull();
  });

  it('does not repeat per mtr under the name — unit lives on Total', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        canEdit={false}
        item={item({
          name: 'Chiffon Roll',
          unit: 'mtr',
          quantity: 10,
          requestedQuantity: 10,
          remainingQuantity: 10,
          rate: 128,
          lineStatus: 'requested',
        })}
        expanded={false}
      />,
    );
    expect(screen.queryByTestId('order-line-identity')).toBeNull();
    expect(screen.queryByText('per mtr')).toBeNull();
    expect(screen.getByTestId('order-line-fact-qty')).toHaveTextContent('10');
    expect(screen.getByTestId('order-line-fact-qty').textContent).not.toMatch(/mtrs|sets/);
    expect(screen.getByText('Chiffon Roll')).toBeTruthy();
  });

  it('opens Confirm from Can’t supply cue before lock', () => {
    const onOpenQuote = vi.fn();
    render(
      <OrderLineFulfillExpand
        {...base}
        canEdit={false}
        item={item({ lineStatus: 'declined', remainingQuantity: 0 })}
        expanded={false}
        onOpenQuote={onOpenQuote}
      />,
    );
    expect(screen.queryByTestId('order-line-edit-icon')).toBeNull();
    fireEvent.click(screen.getByTestId('order-line-cant-supply-cue'));
    expect(onOpenQuote).toHaveBeenCalled();
  });
});
