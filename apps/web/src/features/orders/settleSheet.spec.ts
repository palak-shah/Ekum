import { describe, expect, it } from 'vitest';
import type { OrderItemView } from '@ekum/domain-types';
import {
  defaultSettleFinalQty,
  lineSettleFinalQty,
  orderLineFactsWithSettleFinal,
  settlePayloadLines,
  settleSheetItems,
} from './settleSheet';

function item(partial: Partial<OrderItemView> & { id: string }): OrderItemView {
  return {
    name: 'A',
    quantity: 20,
    rate: 100,
    unit: 'pc',
    lineStatus: 'confirmed',
    remainingQuantity: 5,
    shippedQuantity: 15,
    requestedQuantity: 20,
    productId: 'p1',
    sku: null,
    images: [],
    note: null,
    ...partial,
  } as OrderItemView;
}

describe('settleSheet', () => {
  it('defaults Final to shipped and clamps above shipped', () => {
    const lines = [item({ id: 'a', shippedQuantity: 15 })];
    expect(defaultSettleFinalQty(lines)).toEqual({ a: '15' });
    expect(lineSettleFinalQty(lines[0]!, { a: '20' })).toBe(15);
    expect(lineSettleFinalQty(lines[0]!, { a: '8' })).toBe(8);
    expect(lineSettleFinalQty(lines[0]!, { a: '-1' })).toBe(15);
  });

  it('builds settle payload and skips declined', () => {
    const lines = settleSheetItems([
      item({ id: 'a', shippedQuantity: 15 }),
      item({ id: 'b', lineStatus: 'declined', shippedQuantity: 0 }),
    ]);
    expect(lines.map((row) => row.id)).toEqual(['a']);
    expect(settlePayloadLines(lines, { a: '12' })).toEqual([
      { orderItemId: 'a', quantity: 12 },
    ]);
  });

  it('previews settled facts at Final qty', () => {
    const preview = orderLineFactsWithSettleFinal(
      { quantity: 20, remainingQuantity: 5, shippedQuantity: 15 },
      12,
    );
    expect(preview).toEqual({
      quantity: 12,
      remainingQuantity: 0,
      shippedQuantity: 12,
    });
  });
});
