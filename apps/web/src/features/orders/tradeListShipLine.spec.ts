import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import { howManyOrderFooterSummary, howManySetsBanner, qtyCountNoun } from './howManyLineMeta';
import { tradeListShipLine } from './tradeListShipLine';

function line(partial: {
  id?: string;
  unit?: string;
  dispatchUnit?: string | null;
  piecesPerPack?: number | null;
  quantity?: number;
  shippedQuantity?: number;
  remainingQuantity?: number;
  lineStatus?: string;
}) {
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

function order(partial: Partial<OrderView> & { items?: ReturnType<typeof line>[] }): OrderView {
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
    ).toBe('19 of 40 pieces dispatched · Dispatch pending');
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
  });
});

describe('set vs pc helpers stay consistent with list (no conversion drift)', () => {
  it('How many pack helpers still convert for Place only', () => {
    expect(qtyCountNoun('set')).toBe('sets');
    expect(qtyCountNoun('pc')).toBe('pieces');
    expect(howManySetsBanner([{ unit: 'set', dispatchUnit: 'pc' }])).toBe(
      'You order in sets. Rates and dispatch are per pc.',
    );
    expect(
      howManyOrderFooterSummary([
        { quantity: 2, unit: 'set', piecesPerPack: 6, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ primary: '2 sets = 12 pcs' });
  });
});
