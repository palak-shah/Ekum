import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { OrderView } from '@ekum/domain-types';
import { TradeListGlanceCue } from './tradeListGlanceCue';
import type { TradeListItem } from './tradeList';

function item(partial: {
  status?: string;
  direction?: string;
  tradeMode?: string;
  remaining?: number;
}): TradeListItem {
  const direction = partial.direction ?? 'selling';
  const status = partial.status ?? 'requested';
  const remaining = partial.remaining ?? 10;
  return {
    kind: 'order',
    id: 'o1',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
    direction,
    order: {
      id: 'o1',
      status,
      direction,
      tradeMode: partial.tradeMode ?? 'bilateral',
      intent: 'order',
      items: [
        {
          id: 'oi1',
          name: 'A',
          quantity: 10,
          requestedQuantity: 10,
          shippedQuantity: 10 - remaining,
          remainingQuantity: remaining,
          lineStatus: status === 'requested' ? 'open' : 'confirmed',
          rate: null,
          unit: 'set',
          sku: null,
          productId: 'p1',
          images: [],
          note: null,
        },
      ],
      counterpart: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', verification: 'none', logoUrl: null },
      createdAt: '2026-09-07T00:00:00.000Z',
      updatedAt: '2026-09-07T00:00:00.000Z',
    } as OrderView,
  };
}

describe('TradeListGlanceCue', () => {
  it('Confirm uses the tick in a lime disc, not Needs you copy', () => {
    render(<TradeListGlanceCue item={item({ status: 'requested', direction: 'selling' })} />);
    const cue = screen.getByTestId('orders-needs-you');
    expect(cue).toHaveTextContent('Confirm');
    expect(cue).not.toHaveTextContent('Needs you');
    expect(cue).toHaveAttribute('data-glance-icon', 'confirm');
    expect(cue.querySelector('.bg-badge')).toBeTruthy();
  });

  it('Dispatch uses the truck', () => {
    render(
      <TradeListGlanceCue
        item={item({ status: 'confirmed', direction: 'selling', remaining: 10 })}
      />,
    );
    expect(screen.getByTestId('orders-needs-you')).toHaveAttribute('data-glance-icon', 'dispatch');
    expect(screen.getByTestId('orders-needs-you')).toHaveTextContent('Dispatch');
  });

  it('Forward uses the straight arrow', () => {
    const trading = item({ status: 'requested', direction: 'selling', tradeMode: 'manage' });
    if (trading.kind === 'order') {
      trading.order.linkedMills = [{ name: 'Surat Silk House', orderId: null, held: true }];
    }
    render(<TradeListGlanceCue item={trading} />);
    expect(screen.getByTestId('orders-needs-you')).toHaveAttribute('data-glance-icon', 'forward');
    expect(screen.getByTestId('orders-needs-you')).toHaveTextContent('Forward');
    expect(screen.getByTestId('orders-needs-you')).not.toHaveTextContent('Accept');
  });

  it('idle buying shows Waiting: supplier with no lime disc', () => {
    render(<TradeListGlanceCue item={item({ status: 'requested', direction: 'buying' })} />);
    expect(screen.getByTestId('trade-list-waiting')).toHaveTextContent('Waiting: supplier');
    expect(screen.queryByTestId('orders-needs-you')).toBeNull();
  });
});
