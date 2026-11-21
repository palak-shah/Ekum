import { describe, expect, it } from 'vitest';
import type { OrderItemView, OrderView } from '@ekum/domain-types';
import { howManyOrderFooterSummary, howManySetsBanner, qtyCountNoun } from './howManyLineMeta';
import {
  tradeListShipFact,
  tradeListShipLine,
  tradeListShipProgress,
  tradeListShipTotals,
} from './tradeListShipLine';
import { dispatchSheetShipProgress } from './dispatchSheet';

function line(partial: {
  id?: string;
  unit?: string;
  dispatchUnit?: string | null;
  piecesPerPack?: number | null;
  quantity?: number;
  shippedQuantity?: number;
  remainingQuantity?: number;
  lineStatus?: OrderItemView['lineStatus'];
}): OrderItemView {
  return {
    id: partial.id ?? 'i1',
    productId: null,
    name: 'A',
    sku: null,
    rate: 10,
    unit: partial.unit ?? 'pc',
    dispatchUnit: partial.dispatchUnit ?? null,
    piecesPerPack: partial.piecesPerPack ?? null,
    image: null,
    images: [],
    quantity: partial.quantity ?? 20,
    requestedQuantity: partial.quantity ?? 20,
    lineStatus: partial.lineStatus ?? 'confirmed',
    shippedQuantity: partial.shippedQuantity ?? 0,
    remainingQuantity: partial.remainingQuantity ?? partial.quantity ?? 20,
    note: null,
  };
}

function order(partial: Partial<OrderView> & { items?: OrderItemView[] }): OrderView {
  return {
    id: 'o1',
    direction: 'selling',
    status: 'confirmed',
    tradeMode: 'bilateral',
    items: [line({})],
    ...partial,
  } as OrderView;
}

describe('tradeListShipLine', () => {
  it('pending dispatch with nothing shipped', () => {
    expect(tradeListShipLine(order({}))).toBe('Nothing dispatched yet · Dispatch pending');
  });

  it('native pc — N of M pieces', () => {
    expect(
      tradeListShipLine(
        order({
          status: 'part_shipped',
          items: [
            line({
              unit: 'pc',
              quantity: 40,
              shippedQuantity: 19,
              remainingQuantity: 21,
              lineStatus: 'confirmed',
            }),
          ],
        }),
      ),
    ).toBe('19 of 40 pcs dispatched · Dispatch pending');
  });

  it('1 set with pack 3 is still of 1 — never pcs-as-sets', () => {
    expect(
      tradeListShipProgress(
        order({
          status: 'confirmed',
          items: [
            line({
              unit: 'set',
              dispatchUnit: 'pc',
              piecesPerPack: 3,
              quantity: 1,
              shippedQuantity: 0,
              remainingQuantity: 1,
            }),
          ],
        }),
      ),
    ).toEqual({ shipped: 0, total: 1, over: false });
    expect(
      tradeListShipProgress(
        order({
          status: 'confirmed',
          items: [
            line({
              unit: 'set',
              piecesPerPack: 3,
              quantity: 1,
              shippedQuantity: 1,
              remainingQuantity: 0,
            }),
          ],
        }),
      ),
    ).toEqual({ shipped: 1, total: 1, over: false });
  });

  it('catalog-whole peers collapse to one order qty (not N designs as N sets)', () => {
    const peers = [1, 2, 3].map((n) =>
      line({
        id: `i${n}`,
        unit: 'set',
        piecesPerPack: 3,
        quantity: 1,
        shippedQuantity: 0,
        remainingQuantity: 1,
      }),
    );
    for (const peer of peers) {
      Object.assign(peer, {
        catalogWhole: true,
        catalogCollectionId: 'col-1',
        catalogName: 'Festive',
      });
    }
    expect(
      tradeListShipProgress(
        order({
          status: 'confirmed',
          items: peers,
        }),
      ),
    ).toEqual({ shipped: 0, total: 1, over: false });
  });

  it('set config — N of M sets (no piecesPerPack conversion)', () => {
    expect(
      tradeListShipLine(
        order({
          status: 'part_shipped',
          items: [
            line({
              unit: 'set',
              dispatchUnit: 'pc',
              piecesPerPack: 6,
              quantity: 10,
              shippedQuantity: 3,
              remainingQuantity: 7,
              lineStatus: 'confirmed',
            }),
          ],
        }),
      ),
    ).toBe('3 of 10 sets dispatched · Dispatch pending');
    expect(tradeListShipLine(
      order({
        status: 'part_shipped',
        items: [
          line({
            unit: 'set',
            dispatchUnit: 'pc',
            piecesPerPack: 6,
            quantity: 10,
            shippedQuantity: 3,
            remainingQuantity: 7,
          }),
        ],
      }),
    )).not.toContain('18');
    expect(tradeListShipLine(
      order({
        status: 'part_shipped',
        items: [
          line({
            unit: 'set',
            dispatchUnit: 'pc',
            piecesPerPack: 6,
            quantity: 10,
            shippedQuantity: 3,
            remainingQuantity: 7,
          }),
        ],
      }),
    )).not.toMatch(/60|pcs/);
  });

  it('set complete — N of M sets', () => {
    expect(
      tradeListShipLine(
        order({
          status: 'dispatched',
          items: [
            line({
              unit: 'set',
              dispatchUnit: 'pc',
              piecesPerPack: 6,
              quantity: 10,
              shippedQuantity: 10,
              remainingQuantity: 0,
              lineStatus: 'dispatched',
            }),
          ],
        }),
      ),
    ).toBe('10 of 10 sets dispatched');
  });

  it('mixed set + pc — N of M with no noun', () => {
    expect(
      tradeListShipLine(
        order({
          status: 'part_shipped',
          items: [
            line({
              id: 'a',
              unit: 'set',
              quantity: 10,
              shippedQuantity: 3,
              remainingQuantity: 7,
            }),
            line({
              id: 'b',
              unit: 'pc',
              quantity: 20,
              shippedQuantity: 5,
              remainingQuantity: 15,
            }),
          ],
        }),
      ),
    ).toBe('8 of 30 dispatched · Dispatch pending');
  });

  it('hides when still only requested', () => {
    expect(tradeListShipLine(order({ status: 'requested' }))).toBeNull();
    expect(tradeListShipFact(order({ status: 'requested' }))).toBeNull();
    expect(tradeListShipProgress(order({ status: 'requested' }))).toBeNull();
  });

  it('glance ship fact is order-unit 0/N sent', () => {
    expect(tradeListShipFact(order({}))).toBe('0/20 pcs sent');
    expect(
      tradeListShipFact(
        order({
          status: 'part_shipped',
          items: [
            line({
              unit: 'set',
              dispatchUnit: 'pc',
              piecesPerPack: 6,
              quantity: 10,
              shippedQuantity: 3,
              remainingQuantity: 7,
            }),
          ],
        }),
      ),
    ).toBe('3/10 sets sent');
    expect(
      tradeListShipFact(
        order({
          status: 'part_shipped',
          items: [
            line({
              unit: 'set',
              dispatchUnit: 'pc',
              piecesPerPack: 6,
              quantity: 10,
              shippedQuantity: 3,
              remainingQuantity: 7,
            }),
          ],
        }),
      ),
    ).not.toMatch(/18|pcs/);
  });
});

describe('set vs pc helpers stay consistent with list (no conversion drift)', () => {
  it('How many pack helpers still convert for Place only', () => {
    expect(qtyCountNoun('set')).toBe('sets');
    expect(qtyCountNoun('pc')).toBe('pcs');
    expect(howManySetsBanner([{ unit: 'set', dispatchUnit: 'pc' }])).toBe(
      'Rates are per pc. Order and dispatch per set.',
    );
    expect(
      howManyOrderFooterSummary([
        { quantity: 2, unit: 'set', piecesPerPack: 6, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ rows: ['2 sets = 12 pcs'] });
  });
});

describe('BM confirmed total + singular (#35 / #45)', () => {
  it('excludes declined from progress denominator (same filter as dispatch sheet)', () => {
    const items = [
      line({
        id: 'ok',
        unit: 'set',
        quantity: 11,
        shippedQuantity: 0,
        remainingQuantity: 11,
        lineStatus: 'confirmed',
      }),
      line({
        id: 'no',
        unit: 'set',
        quantity: 4,
        shippedQuantity: 0,
        remainingQuantity: 0,
        lineStatus: 'declined',
      }),
    ];
    const view = order({ status: 'confirmed', items });
    expect(tradeListShipTotals(view)).toEqual({
      shipped: 0,
      remaining: 11,
      ordered: 11,
      noun: 'sets',
    });
    expect(tradeListShipProgress(view)).toEqual({ shipped: 0, total: 11, over: false });
    expect(dispatchSheetShipProgress(items)?.copy).toBe('0 of 11 sets sent');
  });

  it('singular noun when ordered total is 1', () => {
    expect(qtyCountNoun('set', 1)).toBe('set');
    expect(qtyCountNoun('set', 2)).toBe('sets');
    expect(
      tradeListShipTotals(
        order({
          status: 'confirmed',
          items: [
            line({
              unit: 'set',
              quantity: 1,
              shippedQuantity: 0,
              remainingQuantity: 1,
              lineStatus: 'confirmed',
            }),
          ],
        }),
      ).noun,
    ).toBe('set');
    expect(
      tradeListShipFact(
        order({
          status: 'confirmed',
          items: [
            line({
              unit: 'set',
              quantity: 1,
              shippedQuantity: 0,
              remainingQuantity: 1,
              lineStatus: 'confirmed',
            }),
          ],
        }),
      ),
    ).toBe('0/1 set sent');
  });
});
