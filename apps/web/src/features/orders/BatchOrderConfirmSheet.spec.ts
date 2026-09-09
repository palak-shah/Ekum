import { describe, expect, it } from 'vitest';
import { OrderIntent, type CreateOrdersBatchResult } from '@ekum/domain-types';
import { batchConfirmTitle } from './BatchOrderConfirmSheet';

function result(orders: number, failures = 0): CreateOrdersBatchResult {
  return {
    orders: Array.from({ length: orders }, (_, i) => ({
      id: `o${i}`,
      intent: OrderIntent.Order,
      sellerCompanyId: `s${i}`,
    })) as CreateOrdersBatchResult['orders'],
    failures: Array.from({ length: failures }, (_, i) => ({
      sellerCompanyId: `f${i}`,
      sellerName: null,
      productIds: [],
      code: 'X',
      message: 'no',
    })),
  };
}

describe('batchConfirmTitle', () => {
  it('names curated multi-mill Place as one order', () => {
    expect(batchConfirmTitle(result(1), { linkedMillCount: 2 })).toBe('One order · 2 mills');
  });

  it('names true multi-shop batch as separate chats', () => {
    expect(batchConfirmTitle(result(2))).toBe('2 separate chats · one per shop');
  });

  it('keeps single bilateral Place simple', () => {
    expect(batchConfirmTitle(result(1))).toBe('1 order placed');
  });
});
