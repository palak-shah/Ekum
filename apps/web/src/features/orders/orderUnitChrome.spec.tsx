import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  OrderRate,
  OrderUnitGroups,
  OrderUnitTotal,
  orderUnitSheetHeading,
} from './orderUnitChrome';
import { packQtyConversionWanted } from './howManyLineMeta';

describe('orderUnitChrome', () => {
  it('names the sheet job on every heading', () => {
    expect(orderUnitSheetHeading('set', 'ordering')).toBe('Order in Sets');
    expect(orderUnitSheetHeading('pc', 'dispatching')).toBe('Dispatch in Pcs');
    expect(orderUnitSheetHeading('mtr', 'ordering')).toBe('Order in Mtrs');
  });

  it('always shows a unit header, even one family', () => {
    render(
      <OrderUnitGroups
        items={[{ id: 'a', unit: 'mtr' }]}
        unitOf={(item) => item.unit}
        getKey={(item) => item.id}
        role="ordering"
        headingTestId="order-sheet-unit-heading"
      >
        {(item) => <p>{item.id}</p>}
      </OrderUnitGroups>,
    );
    expect(screen.getByTestId('order-sheet-unit-heading')).toHaveTextContent(
      'Order in Mtrs',
    );
  });

  it('converts pack Total only when rate unit differs', () => {
    expect(
      packQtyConversionWanted({ unit: 'set', piecesPerPack: 1, dispatchUnit: 'set' }),
    ).toBe(true);
    expect(
      packQtyConversionWanted({ unit: 'pc', piecesPerPack: 1, dispatchUnit: 'pc' }),
    ).toBe(false);
    render(
      <OrderUnitTotal
        items={[
          { quantity: 50, unit: 'set', piecesPerPack: 1, dispatchUnit: 'set', rate: 1290 },
          { quantity: 50, unit: 'pc', rate: 100 },
        ]}
      />,
    );
    expect(screen.getByTestId('order-ticket-qty-total')).toHaveTextContent('50 sets = 50 pcs');
    expect(screen.getByTestId('order-ticket-grand-total')).toHaveTextContent('₹69,500');
  });

  it('hides Total rupees and missing-rate cue when showBill is off', () => {
    render(
      <OrderUnitTotal
        showBill={false}
        items={[
          { quantity: 4, unit: 'set', piecesPerPack: 1, rate: 91 },
          { quantity: 2, unit: 'set', rate: null },
        ]}
      />,
    );
    expect(screen.getByTestId('order-ticket-qty-total')).toHaveTextContent('6 sets');
    expect(screen.queryByTestId('order-ticket-bill-total')).toBeNull();
    expect(screen.queryByTestId('order-ticket-missing-rates')).toBeNull();
  });

  it('prints OrderRate as ₹/unit', () => {
    render(<OrderRate rate={640} unit="set" dispatchUnit="set" testId="rate" />);
    expect(screen.getByTestId('rate')).toHaveTextContent('₹640/pc');
  });

  it('names Dispatch headers as Dispatch in unit', () => {
    render(
      <OrderUnitGroups
        items={[{ id: 'a', unit: 'set' }]}
        unitOf={(item) => item.unit}
        getKey={(item) => item.id}
        role="dispatching"
        headingTestId="order-sheet-unit-heading"
      >
        {(item) => <p>{item.id}</p>}
      </OrderUnitGroups>,
    );
    expect(screen.getByTestId('order-sheet-unit-heading')).toHaveTextContent(
      'Dispatch in Sets',
    );
  });
});
