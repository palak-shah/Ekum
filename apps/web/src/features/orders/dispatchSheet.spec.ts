import { describe, expect, it } from 'vitest';
import type { OrderItemView } from '@ekum/domain-types';
import {
  defaultDispatchOn,
  defaultDispatchQty,
  dispatchLineCountLine,
  dispatchLineKindLine,
  dispatchPayloadLines,
  dispatchSheetItems,
  dispatchThisLrLabel,
  dispatchThisLrTally,
  emptyDispatchLeg,
  previousDispatchesCue,
  resizeDispatchLegs,
  seedDispatchLegsFromShipment,
  shipmentLegDisplayLines,
  cantSupplyDispatchItems,
  lineDispatchOverBy,
  lineDispatchQty,
  shippableDispatchItems,
} from './dispatchSheet';

function line(partial: Partial<OrderItemView> & { id: string }): OrderItemView {
  return {
    name: 'Design',
    quantity: 20,
    requestedQuantity: 20,
    remainingQuantity: 20,
    shippedQuantity: 0,
    lineStatus: 'confirmed',
    ...partial,
  } as OrderItemView;
}

describe('dispatchSheet', () => {
  const a = line({ id: 'a', name: 'Cotton', remainingQuantity: 20 });
  const b = line({ id: 'b', name: 'Silk', remainingQuantity: 10 });
  const declined = line({
    id: 'c',
    lineStatus: 'declined',
    remainingQuantity: 0,
  });

  it('keeps only pending confirmed lines', () => {
    expect(shippableDispatchItems([a, b, declined]).map((row) => row.id)).toEqual(['a', 'b']);
  });

  it('lists Can’t supply after shippable for the sheet', () => {
    expect(cantSupplyDispatchItems([a, declined, b]).map((row) => row.id)).toEqual(['c']);
    expect(dispatchSheetItems([a, declined, b]).map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('defaults all on at remaining', () => {
    expect(defaultDispatchOn([a, b])).toEqual({ a: true, b: true });
    expect(defaultDispatchQty([a, b])).toEqual({ a: '20', b: '10' });
  });

  it('omits off lines from payload (not qty 0)', () => {
    expect(
      dispatchPayloadLines([a, b], { a: true, b: false }, { a: '20', b: '10' }),
    ).toEqual([{ orderItemId: 'a', quantity: 20 }]);
  });

  it('tallies this LR vs later', () => {
    const tally = dispatchThisLrTally([a, b], { a: true, b: false }, { a: '15', b: '10' });
    expect(tally).toEqual({ designs: 1, pieces: 15, later: 1 });
    expect(dispatchThisLrLabel(tally)).toBe('This LR · 1 design · 15 pcs');
  });

  it('shows sku · unit and ordered / pending', () => {
    expect(
      dispatchLineKindLine(line({ id: 'a', sku: 'EK-AB12', unit: 'mtr', remainingQuantity: 20 })),
    ).toBe('EK-AB12 · per mtr');
    expect(
      dispatchLineCountLine(line({ id: 'a', requestedQuantity: 20, remainingQuantity: 8 })),
    ).toBe('20 ordered · pending 8');
    expect(
      dispatchLineCountLine(
        line({
          id: 'a',
          requestedQuantity: 20,
          remainingQuantity: 2,
          shippedQuantity: 18,
        }),
      ),
    ).toBe('dispatched 18 · pending 2');
    expect(dispatchLineKindLine(line({ id: 'a', sku: null, unit: null }))).toBeNull();
  });

  it('names the previous-dispatches collapse cue', () => {
    expect(previousDispatchesCue(1)).toBe('1 previous dispatch');
    expect(previousDispatchesCue(3)).toBe('3 previous dispatches');
  });

  it('allows typed qty above remaining (over-ship)', () => {
    const one = line({ id: 'a', quantity: 1, remainingQuantity: 1 });
    expect(lineDispatchQty(one, { a: '2' })).toBe(2);
    expect(lineDispatchOverBy(one, { a: '2' })).toBe(1);
    expect(dispatchPayloadLines([one], { a: true }, { a: '2' })).toEqual([
      { orderItemId: 'a', quantity: 2 },
    ]);
    expect(dispatchThisLrTally([one], { a: true }, { a: '2' }).pieces).toBe(2);
  });

  it('resizeDispatchLegs grows with blank pairs and shrinks trailing empties first', () => {
    expect(resizeDispatchLegs([], 1)).toEqual([emptyDispatchLeg()]);
    expect(resizeDispatchLegs([emptyDispatchLeg()], 3)).toHaveLength(3);
    const filled = [
      { lrNumber: 'A', billNumber: '1' },
      { lrNumber: '', billNumber: '' },
      { lrNumber: 'C', billNumber: '' },
    ];
    expect(resizeDispatchLegs(filled, 2)).toEqual([
      { lrNumber: 'A', billNumber: '1' },
      { lrNumber: 'C', billNumber: '' },
    ]);
  });

  it('Parcels N alone grows and shrinks LR rows', () => {
    const one = [emptyDispatchLeg()];
    const three = resizeDispatchLegs(one, 3);
    expect(three).toHaveLength(3);
    expect(resizeDispatchLegs(three, 1)).toHaveLength(1);
  });

  it('seeds legs from API or legacy lrNumber', () => {
    expect(
      seedDispatchLegsFromShipment({
        legs: [
          { id: '1', lrNumber: 'L1', billNumber: 'B1', sortOrder: 0 },
          { id: '2', lrNumber: 'L2', billNumber: null, sortOrder: 1 },
        ],
        lrNumber: 'L1',
        parcelCount: 2,
      }),
    ).toEqual([
      { lrNumber: 'L1', billNumber: 'B1', imageUrls: [] },
      { lrNumber: 'L2', billNumber: '', imageUrls: [] },
    ]);
    expect(
      seedDispatchLegsFromShipment({
        legs: [
          {
            id: '1',
            lrNumber: 'L1',
            billNumber: 'B1',
            imageUrls: ['https://a/lr.jpg'],
            sortOrder: 0,
          },
        ],
        lrNumber: 'L1',
        parcelCount: 1,
      }),
    ).toEqual([{ lrNumber: 'L1', billNumber: 'B1', imageUrls: ['https://a/lr.jpg'] }]);
    expect(
      seedDispatchLegsFromShipment({
        legs: [],
        lrNumber: 'OLD',
        parcelCount: null,
      }),
    ).toEqual([{ lrNumber: 'OLD', billNumber: '', imageUrls: [] }]);
  });

  it('formats shipment leg display lines with bill', () => {
    expect(
      shipmentLegDisplayLines({
        lrNumber: 'L1',
        legs: [
          { id: '1', lrNumber: 'L1', billNumber: 'INV-9', imageUrls: [], sortOrder: 0 },
          { id: '2', lrNumber: 'L2', billNumber: null, imageUrls: [], sortOrder: 1 },
        ],
      }),
    ).toEqual(['LR · L1 · Bill INV-9', 'LR · L2']);
  });
});
