import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import {
  matchesTradePending,
  sortTradePending,
  toTradeItems,
} from './tradeList';

function order(partial: Partial<OrderView>): OrderView {
  return {
    id: 'o1',
    status: 'confirmed',
    direction: 'selling',
    createdAt: '2026-01-01T00:00:00.000Z',
    items: [
      {
        id: 'oi1',
        name: 'A',
        quantity: 10,
        requestedQuantity: 10,
        shippedQuantity: 0,
        remainingQuantity: 10,
        lineStatus: 'open',
        rate: null,
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

describe('matchesTradePending', () => {
  it('includes open statuses and excludes completed', () => {
    const open = toTradeItems([order({ id: 'o1', status: 'requested' })], [], [])[0]!;
    const done = toTradeItems([order({ id: 'o2', status: 'dispatched' })], [], [])[0]!;
    expect(matchesTradePending(open)).toBe(true);
    expect(matchesTradePending(done)).toBe(false);
  });
});

describe('sortTradePending', () => {
  it('puts Needs you rows before waiting rows', () => {
    const waiting = toTradeItems(
      [
        order({
          id: 'wait',
          status: 'requested',
          direction: 'buying',
          createdAt: '2026-01-02T00:00:00.000Z',
          canAcceptQuote: false,
        }),
      ],
      [],
      [],
    )[0]!;
    const needs = toTradeItems(
      [
        order({
          id: 'need',
          status: 'requested',
          direction: 'selling',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      ],
      [],
      [],
    )[0]!;

    expect(sortTradePending([waiting, needs]).map((row) => row.id)).toEqual(['need', 'wait']);
  });
});
