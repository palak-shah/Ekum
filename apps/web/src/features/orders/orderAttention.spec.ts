import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import { matchesCompleted, matchesNeeds, sellerNeedsDispatch } from './orderAttention';

function order(partial: Partial<OrderView>): OrderView {
  return {
    id: 'o1',
    status: 'confirmed',
    direction: 'selling',
    items: [
      {
        id: 'oi1',
        name: 'A',
        quantity: 10,
        requestedQuantity: 10,
        shippedQuantity: 4,
        remainingQuantity: 6,
        lineStatus: 'confirmed',
        rate: 100,
        unit: 'pc',
        sku: null,
        productId: 'p1',
        images: [],
        note: null,
      },
    ],
    ...partial,
  } as OrderView;
}

describe('orderAttention settle', () => {
  it('marks settled as completed', () => {
    expect(matchesCompleted(order({ status: 'settled' }))).toBe(true);
    expect(matchesCompleted(order({ status: 'delivered' }))).toBe(true);
    expect(matchesCompleted(order({ status: 'part_shipped' }))).toBe(false);
  });

  it('marks full dispatch as completed', () => {
    expect(matchesCompleted(order({ status: 'dispatched' }))).toBe(true);
  });

  it('needs dispatch when remaining qty exists', () => {
    expect(sellerNeedsDispatch(order({}))).toBe(true);
    expect(sellerNeedsDispatch(order({ status: 'part_shipped' }))).toBe(true);
    expect(
      sellerNeedsDispatch(
        order({
          items: [
            {
              id: 'oi1',
              name: 'A',
              quantity: 4,
              requestedQuantity: 10,
              shippedQuantity: 4,
              remainingQuantity: 0,
              lineStatus: 'dispatched',
              rate: 100,
              unit: 'pc',
              sku: null,
              productId: 'p1',
              images: [],
              note: null,
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('needs action when canSettle', () => {
    expect(matchesNeeds(order({ canSettle: true, direction: 'selling' }))).toBe(true);
  });

  it('needs the trader when a mill quoted and Meena has not', () => {
    expect(matchesNeeds(order({ status: 'requested', needsQuotePass: true }))).toBe(true);
  });
});
