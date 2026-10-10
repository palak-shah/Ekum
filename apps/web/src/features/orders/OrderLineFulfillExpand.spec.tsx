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
  onSaveLastLr: vi.fn(),
};

describe('OrderLineFulfillExpand', () => {
  it('shows edit icon · fact strip · Last LR — no inline Ship now / Dispatch', () => {
    const onSaveLastLr = vi.fn();
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        hasLastLr
        lastLrQty={8}
        expanded
        onSaveLastLr={onSaveLastLr}
      />,
    );
    expect(screen.getByTestId('order-line-facts')).toBeTruthy();
    expect(screen.getByTestId('order-line-fact-qty')).toHaveTextContent('20');
    expect(screen.getByTestId('order-line-fact-shipped')).toHaveTextContent('15');
    expect(screen.getByTestId('order-line-fact-balance')).toHaveTextContent('-5');
    expect(screen.queryByTestId('order-line-fact-pending')).toBeNull();
    expect(screen.queryByText('Asked')).toBeNull();
    expect(screen.queryByText('Already shipped')).toBeNull();
    expect(screen.queryByTestId('order-line-ship-now')).toBeNull();
    expect(screen.queryByTestId('order-line-dispatch')).toBeNull();
    expect(screen.getByText('Last LR')).toBeTruthy();
    expect((screen.getByTestId('order-line-last-lr-qty') as HTMLInputElement).value).toBe('8');
    fireEvent.change(screen.getByTestId('order-line-last-lr-qty'), { target: { value: '6' } });
    fireEvent.click(screen.getByTestId('order-line-last-lr-save'));
    expect(onSaveLastLr).toHaveBeenCalledWith(6);
  });

  it('opens expand from the pencil only — not the row body', () => {
    const onToggle = vi.fn();
    render(
      <OrderLineFulfillExpand
        {...base}
        onToggle={onToggle}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        hasLastLr
        lastLrQty={8}
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
        hasLastLr
        lastLrQty={8}
        expanded
      />,
    );
    expect(screen.queryByTestId('order-line-edit-icon')).toBeNull();
    fireEvent.click(screen.getByTestId('order-line-close-edit'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keeps Last LR draft when parent re-renders', () => {
    const { rerender } = render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        hasLastLr
        lastLrQty={8}
        expanded
      />,
    );
    fireEvent.change(screen.getByTestId('order-line-last-lr-qty'), { target: { value: '3' } });
    rerender(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        hasLastLr
        lastLrQty={8}
        expanded
      />,
    );
    expect((screen.getByTestId('order-line-last-lr-qty') as HTMLInputElement).value).toBe('3');
  });

  it('allows Last LR edit after complete', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 20, remainingQuantity: 0 })}
        hasLastLr
        lastLrQty={20}
        expanded
      />,
    );
    expect(screen.getByTestId('order-line-last-lr-qty')).toBeTruthy();
    expect(screen.queryByTestId('order-line-ship-now')).toBeNull();
    expect(screen.queryByTestId('order-line-dispatch')).toBeNull();
  });

  it('hides Can’t supply toggle on grayed collapsed row — cue only', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ lineStatus: 'declined', remainingQuantity: 0, shippedQuantity: 20 })}
        hasLastLr={false}
        lastLrQty={0}
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
        hasLastLr={false}
        lastLrQty={0}
        expanded
      />,
    );
    expect(screen.getByTestId('order-line-cant-supply-toggle')).toBeTruthy();
  });

  it('opens Send quote from Can’t supply cue before lock', () => {
    const onOpenQuote = vi.fn();
    render(
      <OrderLineFulfillExpand
        {...base}
        canEdit={false}
        item={item({ lineStatus: 'declined', remainingQuantity: 0 })}
        hasLastLr={false}
        lastLrQty={0}
        expanded={false}
        onOpenQuote={onOpenQuote}
      />,
    );
    expect(screen.queryByTestId('order-line-edit-icon')).toBeNull();
    fireEvent.click(screen.getByTestId('order-line-cant-supply-cue'));
    expect(onOpenQuote).toHaveBeenCalled();
  });
});
