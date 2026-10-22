import { describe, expect, it } from 'vitest';
import type { OrderItemView } from '@ekum/domain-types';
import {
  clampSettleQtyInput,
  defaultSettleFinalQty,
  lineSettleFinalQty,
  lineSettleLeftoverQty,
  orderLineFactsForSettleRemainder,
  settleLeftoverFooterSummary,
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

  it('clamps settle Final input while typing or pasting', () => {
    expect(clampSettleQtyInput('', 15)).toBe('');
    expect(clampSettleQtyInput('8', 15)).toBe('8');
    expect(clampSettleQtyInput('20', 15)).toBe('15');
    expect(clampSettleQtyInput('15.9', 15)).toBe('15');
    expect(clampSettleQtyInput('-3', 15)).toBe('0');
    expect(clampSettleQtyInput('abc', 15)).toBe('');
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

  it('previews remainder with Ordered kept', () => {
    const leftover = orderLineFactsForSettleRemainder(
      { quantity: 20, remainingQuantity: 5, shippedQuantity: 15 },
      12,
    );
    expect(leftover).toEqual({
      quantity: 20,
      remainingQuantity: 8,
      shippedQuantity: 12,
    });
    const extra = orderLineFactsForSettleRemainder(
      { quantity: 20, remainingQuantity: 0, shippedQuantity: 23 },
      23,
    );
    expect(extra).toEqual({
      quantity: 20,
      remainingQuantity: 0,
      shippedQuantity: 23,
    });
    expect(lineSettleLeftoverQty(item({ id: 'a', quantity: 20, shippedQuantity: 15 }), { a: '15' })).toBe(
      5,
    );
    expect(lineSettleLeftoverQty(item({ id: 'a', quantity: 20, shippedQuantity: 15 }), { a: '12' })).toBe(
      8,
    );
  });

  it('groups leftover in the footer without money', () => {
    const summary = settleLeftoverFooterSummary(
      [
        item({ id: 'a', quantity: 20, shippedQuantity: 15, remainingQuantity: 5, unit: 'pc' }),
        item({ id: 'b', quantity: 10, shippedQuantity: 4, remainingQuantity: 6, unit: 'pc', rate: 50 }),
      ],
      { a: '15', b: '4' },
    );
    expect(summary?.rows).toEqual(['11 pcs']);
    expect(summary?.money).toBeUndefined();
  });
});
