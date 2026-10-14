import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  OrderLineFacts,
  formatOrderLineBalance,
  orderLineBalance,
  orderLineBalanceRowClass,
  orderLineFactsWithThisLr,
} from './OrderLineFacts';

describe('OrderLineFacts', () => {
  it('shows Qty and Price as a divider strip — not boxes', () => {
    render(
      <OrderLineFacts
        density="detail"
        item={{
          quantity: 20,
          rate: 640,
          unit: 'set',
          lineStatus: 'requested',
          remainingQuantity: 20,
          shippedQuantity: 0,
        }}
      />,
    );
    expect(screen.getByTestId('order-line-facts').className).toContain('divide-x');
    expect(screen.getByTestId('order-line-fact-qty')).toHaveTextContent('Qty');
    expect(screen.getByTestId('order-line-fact-qty')).toHaveTextContent('20 sets');
    expect(screen.getByTestId('order-line-fact-price')).toHaveTextContent('Price');
    expect(screen.getByTestId('order-line-fact-price')).toHaveTextContent('₹640');
    expect(screen.queryByTestId('order-line-fact-bill')).toBeNull();
    expect(screen.queryByTestId('order-line-fact-shipped')).toBeNull();
    expect(screen.queryByTestId('order-line-fact-balance')).toBeNull();
  });

  it('bills sets × pack × rate and shows dual qty', () => {
    render(
      <OrderLineFacts
        density="detail"
        item={{
          quantity: 10,
          rate: 100,
          unit: 'set',
          piecesPerPack: 4,
          dispatchUnit: 'pc',
          lineStatus: 'requested',
        }}
      />,
    );
    expect(screen.getByTestId('order-line-fact-qty')).toHaveTextContent('10 sets (= 40 pcs)');
    expect(screen.getByTestId('order-line-fact-bill')).toHaveTextContent('₹4,000');
    expect(screen.getByTestId('order-line-billing-captions')).toHaveTextContent(
      '1 set = 4 pcs · price per pc = ₹100 · order = 10 sets = 40 pcs · ₹4,000',
    );
  });

  it('hides Price when rate is missing', () => {
    render(
      <OrderLineFacts
        item={{
          quantity: 20,
          rate: null,
          unit: 'set',
          lineStatus: 'requested',
        }}
      />,
    );
    expect(screen.getByTestId('order-line-fact-qty')).toBeTruthy();
    expect(screen.queryByTestId('order-line-fact-price')).toBeNull();
  });

  it('uses a quiet one-line summary in sheets when density=sheet', () => {
    render(
      <OrderLineFacts
        density="sheet"
        item={{
          quantity: 20,
          rate: 85,
          unit: 'mtr',
          lineStatus: 'confirmed',
          remainingQuantity: 20,
          shippedQuantity: 0,
        }}
      />,
    );
    expect(screen.getByTestId('order-line-facts')).toHaveAttribute('data-density', 'sheet');
    expect(screen.getByTestId('order-line-fact-balance')).toHaveTextContent('-20');
  });

  it('defaults to compact divider strip beside the thumb', () => {
    render(
      <OrderLineFacts
        item={{
          quantity: 20,
          rate: 85,
          unit: 'mtr',
          lineStatus: 'confirmed',
          remainingQuantity: 20,
          shippedQuantity: 0,
        }}
      />,
    );
    expect(screen.getByTestId('order-line-facts')).toHaveAttribute('data-density', 'compact');
    expect(screen.getByTestId('order-line-facts').className).toContain('divide-x');
    expect(screen.getByTestId('order-line-fact-shipped')).toHaveTextContent('Ship');
    expect(screen.getByTestId('order-line-fact-balance')).toHaveTextContent('Balance');
    expect(screen.getByTestId('order-line-fact-balance')).toHaveTextContent('-20');
  });

  it('shows the full Bill amount on compact strip (not ₹4…)', () => {
    render(
      <OrderLineFacts
        item={{
          quantity: 50,
          rate: 85,
          unit: 'mtr',
          lineStatus: 'requested',
        }}
      />,
    );
    const bill = screen.getByTestId('order-line-fact-bill');
    expect(bill).toHaveTextContent('₹4,250');
    expect(bill.textContent).not.toMatch(/₹4…|₹4\.\.\./);
    expect(bill.className).toMatch(/flex-\[1\.4\]|min-w-\[4\.5rem\]/);
  });

  it('shows full Price label (not PRI…) and full-width strip', () => {
    render(
      <OrderLineFacts
        item={{
          quantity: 50,
          rate: 85,
          unit: 'mtr',
          lineStatus: 'requested',
        }}
      />,
    );
    const price = screen.getByTestId('order-line-fact-price');
    expect(price).toHaveTextContent('Price');
    expect(price).toHaveTextContent('₹85');
    expect(price.textContent).not.toMatch(/PRI/);
    expect(screen.getByTestId('order-line-facts').className).toContain('w-full');
  });

  it('shows signed Balance for open / over / done', () => {
    const { rerender } = render(
      <OrderLineFacts
        item={{
          quantity: 20,
          rate: 640,
          unit: 'set',
          lineStatus: 'confirmed',
          remainingQuantity: 5,
          shippedQuantity: 15,
        }}
      />,
    );
    expect(screen.getByTestId('order-line-fact-shipped')).toHaveTextContent('15');
    expect(screen.getByTestId('order-line-fact-balance')).toHaveTextContent('-5');

    rerender(
      <OrderLineFacts
        item={{
          quantity: 20,
          rate: 640,
          unit: 'set',
          lineStatus: 'confirmed',
          remainingQuantity: 0,
          shippedQuantity: 60,
        }}
      />,
    );
    expect(screen.getByTestId('order-line-fact-balance')).toHaveTextContent('+40');
    const overValue = screen.getByTestId('order-line-fact-balance').querySelector('p:last-child');
    expect(overValue?.className).toContain('text-info');
    expect(overValue?.className).not.toContain('text-ink');

    rerender(
      <OrderLineFacts
        item={{
          quantity: 20,
          rate: 640,
          unit: 'set',
          lineStatus: 'dispatched',
          remainingQuantity: 0,
          shippedQuantity: 20,
        }}
      />,
    );
    expect(screen.getByTestId('order-line-fact-balance')).toHaveTextContent('0');
  });
});

describe('orderLineFactsWithThisLr', () => {
  it('previews Ship and Balance after This LR — over shows as +balance', () => {
    const base = {
      quantity: 20,
      rate: 85,
      unit: 'mtr',
      lineStatus: 'confirmed',
      remainingQuantity: 20,
      shippedQuantity: 0,
    };
    const preview = orderLineFactsWithThisLr(base, 25, true);
    expect(preview.shippedQuantity).toBe(25);
    expect(preview.remainingQuantity).toBe(0);
    expect(orderLineBalance(preview)).toEqual({ value: 5, tone: 'over' });
  });

  it('ignores This LR when the line is off', () => {
    const base = {
      quantity: 20,
      rate: null,
      unit: null,
      lineStatus: 'confirmed',
      remainingQuantity: 8,
      shippedQuantity: 12,
    };
    expect(orderLineFactsWithThisLr(base, 8, false)).toEqual(base);
  });
});

describe('orderLineBalance', () => {
  it('uses one open tone for any under-ship', () => {
    expect(
      orderLineBalance({
        quantity: 20,
        rate: null,
        unit: null,
        lineStatus: 'confirmed',
        remainingQuantity: 20,
        shippedQuantity: 0,
      }),
    ).toEqual({ value: -20, tone: 'open' });
    expect(
      orderLineBalance({
        quantity: 20,
        rate: null,
        unit: null,
        lineStatus: 'confirmed',
        remainingQuantity: 5,
        shippedQuantity: 15,
      }),
    ).toEqual({ value: -5, tone: 'open' });
  });

  it('tints the whole row from Balance tone', () => {
    expect(formatOrderLineBalance(40)).toBe('+40');
    expect(
      orderLineBalanceRowClass({
        quantity: 20,
        rate: null,
        unit: null,
        lineStatus: 'dispatched',
        remainingQuantity: 0,
        shippedQuantity: 20,
      }),
    ).toContain('bg-success-soft');
    expect(
      orderLineBalanceRowClass({
        quantity: 20,
        rate: null,
        unit: null,
        lineStatus: 'confirmed',
        remainingQuantity: 5,
        shippedQuantity: 15,
      }),
    ).toContain('bg-warning-soft');
    expect(
      orderLineBalanceRowClass({
        quantity: 20,
        rate: null,
        unit: null,
        lineStatus: 'confirmed',
        remainingQuantity: 0,
        shippedQuantity: 25,
      }),
    ).toContain('bg-info-soft');
  });
});
