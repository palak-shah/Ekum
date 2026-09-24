import { describe, expect, it } from 'vitest';
import type { OrderItemView } from '@ekum/domain-types';
import {
  defaultDispatchOn,
  defaultDispatchQty,
  dispatchLineCountLine,
  dispatchLineKindLine,
  dispatchPayloadLines,
  dispatchThisLrLabel,
  dispatchThisLrTally,
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
    ).toBe('EK-AB12 · mtr');
    expect(
      dispatchLineCountLine(line({ id: 'a', requestedQuantity: 20, remainingQuantity: 8 })),
    ).toBe('20 ordered · pending 8');
    expect(dispatchLineKindLine(line({ id: 'a', sku: null, unit: null }))).toBeNull();
  });
});
