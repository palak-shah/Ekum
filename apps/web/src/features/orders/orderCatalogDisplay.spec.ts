import type { OrderItemView } from '@ekum/domain-types';
import { describe, expect, it } from 'vitest';
import { ticketBillItems, ticketDisplayItems } from './orderCatalogDisplay';

function line(over: Partial<OrderItemView> & { id: string; name: string }): OrderItemView {
  return {
    productId: over.id,
    sku: null,
    rate: 450,
    unit: 'pc',
    image: null,
    images: [],
    quantity: 1,
    requestedQuantity: 1,
    lineStatus: 'open',
    shippedQuantity: 0,
    remainingQuantity: 1,
    note: null,
    catalogCollectionId: 'cat-1',
    catalogName: 'Season',
    catalogWhole: true,
    ...over,
  };
}

describe('ticketDisplayItems', () => {
  it('collapses a whole catalog to one named row', () => {
    const rows = ticketDisplayItems([
      line({ id: 'a', name: 'Silk' }),
      line({ id: 'b', name: 'Cotton' }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe('Season');
  });

  it('leaves mill hops as separate designs', () => {
    const rows = ticketDisplayItems([
      line({ id: 'a', name: 'Silk', sourceItemId: 'parent' }),
      line({ id: 'b', name: 'Cotton', sourceItemId: 'parent' }),
    ]);
    expect(rows.map((row) => row.name)).toEqual(['Silk', 'Cotton']);
  });
});

describe('ticketBillItems', () => {
  it('bills qty × rate × designs for Rate per pc', () => {
    const billed = ticketBillItems([
      line({ id: 'a', name: 'Silk' }),
      line({ id: 'b', name: 'Cotton' }),
    ]);
    expect(billed).toHaveLength(1);
    expect(billed[0]?.quantity).toBe(1);
    expect(billed[0]?.rate).toBe(900);
  });
});
