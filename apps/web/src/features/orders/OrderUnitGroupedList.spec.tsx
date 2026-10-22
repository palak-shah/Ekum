import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  OrderTicketBillBlock,
  OrderTicketQtySummary,
  OrderUnitGroupedList,
  TicketLineWash,
} from './OrderUnitGroupedList';

describe('OrderUnitGroupedList', () => {
  it('always shows the ordering-unit heading', () => {
    render(
      <OrderUnitGroupedList
        items={[
          { id: 'a', unit: 'mtr' },
          { id: 'b', unit: 'mtr' },
        ]}
        unitOf={(item) => item.unit}
        getKey={(item) => item.id}
      >
        {(item) => <p>{item.id}</p>}
      </OrderUnitGroupedList>,
    );
    expect(screen.getByTestId('order-ticket-unit-heading')).toHaveTextContent(
      'Order in Mtrs',
    );
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('b')).toBeTruthy();
  });

  it('restacks Sets then Mtrs when mixed', () => {
    render(
      <OrderUnitGroupedList
        items={[
          { id: 'chiffon', unit: 'mtr' },
          { id: 'navy', unit: 'set' },
        ]}
        unitOf={(item) => item.unit}
        getKey={(item) => item.id}
      >
        {(item) => <p>{item.id}</p>}
      </OrderUnitGroupedList>,
    );
    const headings = screen.getAllByTestId('order-ticket-unit-heading');
    expect(headings.map((el) => el.textContent)).toEqual([
      'Order in Sets',
      'Order in Mtrs',
    ]);
    const groups = screen.getByTestId('order-ticket-unit-groups');
    expect(groups.textContent).toMatch(/Order in Sets.*navy.*Order in Mtrs.*chiffon/s);
  });
});

describe('OrderTicketQtySummary', () => {
  it('puts Total left of metres, ₹ right-aligned on the row', () => {
    render(
      <OrderTicketQtySummary
        items={[
          { quantity: 10, unit: 'mtr', rate: 128 },
          { quantity: 10, unit: 'mtr', rate: 160 },
        ]}
      />,
    );
    expect(screen.getByTestId('order-ticket-qty-summary').className).toContain('flex');
    expect(screen.getByTestId('order-ticket-total-label')).toHaveTextContent('Total');
    expect(screen.getByTestId('order-ticket-qty-total')).toHaveTextContent('20 mtrs');
    expect(screen.getByTestId('order-ticket-qty-total').className).toContain('whitespace-nowrap');
    const bill = screen.getByTestId('order-ticket-bill-total');
    expect(bill).toHaveTextContent('₹2,880');
    expect(bill.className).toContain('text-right');
    expect(screen.queryByTestId('how-many-sets-summary')).toBeNull();
    expect(screen.queryByTestId('order-ticket-grand-total')).toBeNull();
  });

  it('bills the rated metres and flags Missing rates', () => {
    render(
      <OrderTicketQtySummary
        items={[
          { quantity: 10, unit: 'mtr', rate: 128 },
          { quantity: 10, unit: 'mtr', rate: 160, lineStatus: 'declined' },
          { quantity: 10, unit: 'mtr', rate: null },
        ]}
      />,
    );
    expect(screen.getByTestId('order-ticket-qty-total')).toHaveTextContent('20 mtrs');
    expect(screen.getByTestId('order-ticket-bill-total')).toHaveTextContent('₹1,280');
    const cue = screen.getByTestId('order-ticket-missing-rates');
    expect(cue).toHaveTextContent('+Missing rates');
    expect(cue.className).toContain('text-right');
    expect(cue.className).toContain('text-tangerine');
    expect(cue.className).not.toMatch(/text-ink/);
    expect(screen.queryByTestId('order-ticket-grand-total')).toBeNull();
  });

  it('flags +No pcs in a set under the Total ₹ column', () => {
    render(
      <OrderTicketQtySummary items={[{ quantity: 10, unit: 'set', rate: 100 }]} />,
    );
    expect(screen.getByTestId('order-ticket-missing-rates')).toHaveTextContent(
      '+No pcs in a set',
    );
  });

  it('splits mixed mill-bill ₹ per unit then All', () => {
    render(
      <OrderTicketQtySummary
        items={[
          { quantity: 2, unit: 'set', piecesPerPack: 12, dispatchUnit: 'pc', rate: 100 },
          { quantity: 70, unit: 'mtr', rate: 50 },
        ]}
      />,
    );
    const rows = screen.getAllByTestId('order-ticket-unit-bill');
    expect(rows).toHaveLength(2);
    expect(screen.getByTestId('order-ticket-qty-total')).toHaveTextContent('2 sets = 24 pcs');
    expect(screen.getByTestId('order-ticket-bill-total')).toHaveTextContent('₹2,400');
    expect(rows[1]).toHaveTextContent('70 mtrs');
    expect(rows[1]).toHaveTextContent('₹3,500');
    const grand = screen.getByTestId('order-ticket-grand-total');
    expect(grand).toHaveTextContent('All');
    expect(grand).toHaveTextContent('₹5,900');
  });

  it('sums billed ₹, All, and Missing rates toggle lights uncounted lines', () => {
    render(
      <OrderTicketBillBlock
        items={[
          { quantity: 50, unit: 'set', piecesPerPack: 1, rate: 1290, name: 'Georgette' },
          { quantity: 50, unit: 'set', piecesPerPack: 1, name: 'Banarasi' },
          { quantity: 50, unit: 'pc', rate: 100, name: 'Swatch' },
        ]}
      >
        <TicketLineWash
          item={{ quantity: 50, unit: 'set', piecesPerPack: 1 }}
          data-testid="uncounted-line"
        >
          Banarasi
        </TicketLineWash>
      </OrderTicketBillBlock>,
    );
    expect(screen.getByTestId('order-ticket-bill-total')).toHaveTextContent('₹64,500');
    expect(screen.getByTestId('order-ticket-grand-total')).toHaveTextContent('₹69,500');
    const cue = screen.getByTestId('order-ticket-missing-rates');
    expect(cue).toHaveTextContent('+Missing rates');
    expect(cue.className).toContain('text-right');
    expect(cue.className).toContain('text-tangerine');
    expect(cue.className).not.toMatch(/text-ink/);
    expect(screen.getByTestId('uncounted-line').className).not.toMatch(/ring-tangerine/);
    fireEvent.click(cue);
    expect(cue).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('uncounted-line').className).toMatch(/ring-tangerine/);
  });

  it('keeps mill-bill Total on Qty and Bill when lines show Ship / Balance', () => {
    render(
      <OrderTicketQtySummary
        items={[
          {
            quantity: 10,
            unit: 'mtr',
            rate: 128,
            lineStatus: 'confirmed',
            remainingQuantity: 10,
            shippedQuantity: 0,
          },
          {
            quantity: 10,
            unit: 'mtr',
            rate: 160,
            lineStatus: 'confirmed',
            remainingQuantity: 10,
            shippedQuantity: 0,
          },
        ]}
      />,
    );
    const qty = screen.getByTestId('order-ticket-qty-total');
    expect(qty).toHaveTextContent('20 mtrs');
    expect(qty.className).toContain('whitespace-nowrap');
    expect(screen.getByTestId('order-ticket-bill-total')).toHaveTextContent('₹2,880');
    expect(screen.getByTestId('order-ticket-bill-total').className).toContain('text-right');
    expect(screen.queryByTestId('order-ticket-ship-total')).toBeNull();
    expect(screen.queryByTestId('order-ticket-balance-total')).toBeNull();
  });
});
