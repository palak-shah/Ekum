import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import type { SampleView } from '@ekum/domain-types';
import {
  matchesTradePending,
  samplesForOthersList,
  sortTradePending,
  toTradeItems,
  tradeMatchesListTab,
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

describe('toTradeItems sort', () => {
  it('orders by updatedAt desc', () => {
    const rows = toTradeItems(
      [
        order({
          id: 'old',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
        order({
          id: 'edited',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        }),
      ],
      [],
      [],
    );
    expect(rows.map((row) => row.id)).toEqual(['edited', 'old']);
  });
});

describe('list tabs', () => {
  it('keeps orders on Selling or Buying and complaints on Others', () => {
    const rows = toTradeItems(
      [order({ id: 'sell', direction: 'selling' }), order({ id: 'buy', direction: 'buying' })],
      [],
      [],
      [
        {
          id: 'c1',
          status: 'open',
          subject: 'Short',
          mine: false,
          createdAt: '2026-01-04T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        } as never,
      ],
    );
    expect(rows.filter((row) => tradeMatchesListTab(row, 'selling')).map((row) => row.id)).toEqual([
      'sell',
    ]);
    expect(rows.filter((row) => tradeMatchesListTab(row, 'buying')).map((row) => row.id)).toEqual([
      'buy',
    ]);
    expect(rows.filter((row) => tradeMatchesListTab(row, 'others')).map((row) => row.id)).toEqual([
      'c1',
    ]);
  });

  it('drops a sample that is already a line on an order between the same shops', () => {
    const orders = [
      order({
        id: 'o1',
        buyerCompanyId: 'b',
        sellerCompanyId: 's',
        items: [
          {
            id: 'oi1',
            name: 'A',
            quantity: 1,
            requestedQuantity: 1,
            shippedQuantity: 0,
            remainingQuantity: 1,
            lineStatus: 'open',
            rate: 10,
            unit: 'pc',
            sku: null,
            productId: 'p1',
            images: [],
            note: null,
          },
        ],
      }),
    ];
    const samples = [
      {
        id: 'attached',
        status: 'requested',
        productId: 'p1',
        buyerCompanyId: 'b',
        sellerCompanyId: 's',
      },
      {
        id: 'free',
        status: 'requested',
        productId: 'p2',
        buyerCompanyId: 'b',
        sellerCompanyId: 's',
      },
      {
        id: 'done',
        status: 'converted',
        productId: 'p9',
        buyerCompanyId: 'b',
        sellerCompanyId: 's',
      },
    ] as SampleView[];
    expect(samplesForOthersList(samples, orders).map((row) => row.id)).toEqual(['free']);
  });
});
