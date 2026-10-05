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
  onDispatch: vi.fn(),
  onSaveLastLr: vi.fn(),
};

describe('OrderLineFulfillExpand', () => {
  it('shows Asked · Already shipped · Last LR · Ship now', () => {
    const onDispatch = vi.fn();
    const onSaveLastLr = vi.fn();
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 15, remainingQuantity: 5 })}
        hasLastLr
        lastLrQty={8}
        expanded
        onDispatch={onDispatch}
        onSaveLastLr={onSaveLastLr}
      />,
    );
    expect(screen.getByText('Asked')).toBeTruthy();
    expect(screen.getByText('Already shipped')).toBeTruthy();
    expect(screen.getByText('Last LR')).toBeTruthy();
    expect((screen.getByTestId('order-line-last-lr-qty') as HTMLInputElement).value).toBe('8');
    fireEvent.change(screen.getByTestId('order-line-last-lr-qty'), { target: { value: '6' } });
    fireEvent.click(screen.getByTestId('order-line-last-lr-save'));
    expect(onSaveLastLr).toHaveBeenCalledWith(6);
    fireEvent.change(screen.getByTestId('order-line-ship-now'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('order-line-dispatch'));
    expect(onDispatch).toHaveBeenCalledWith(10);
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

  it('allows Last LR edit after complete; hides Ship now', () => {
    render(
      <OrderLineFulfillExpand
        {...base}
        item={item({ shippedQuantity: 20, remainingQuantity: 0 })}
        canDispatch={false}
        hasLastLr
        lastLrQty={20}
        expanded
      />,
    );
    expect(screen.getByTestId('order-line-last-lr-qty')).toBeTruthy();
    expect(screen.queryByTestId('order-line-ship-now')).toBeNull();
    expect(screen.queryByTestId('order-line-dispatch')).toBeNull();
  });
});
