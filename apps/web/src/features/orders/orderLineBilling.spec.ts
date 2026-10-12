import { describe, expect, it } from 'vitest';
import {
  formatDualQty,
  formatPackingSlipTotal,
  lineBillAmount,
  orderLineBillingCaptions,
} from './orderLineBilling';

describe('orderLineBilling', () => {
  it('formats dual qty with dispatch noun', () => {
    expect(
      formatDualQty({ quantity: 10, unit: 'set', piecesPerPack: 4, dispatchUnit: 'pc' }),
    ).toBe('10 sets (= 40 pcs)');
    expect(
      formatDualQty({ quantity: 10, unit: 'set', piecesPerPack: 5, dispatchUnit: 'mtr' }),
    ).toBe('10 sets (= 50 mtrs)');
    expect(
      formatDualQty({ quantity: 10, unit: 'set', piecesPerPack: null, dispatchUnit: 'mtr' }),
    ).toBe('10 sets');
  });

  it('builds packing slip total', () => {
    expect(
      formatPackingSlipTotal({
        lines: [
          { quantity: 10, unit: 'set', piecesPerPack: 4, dispatchUnit: 'pc' },
          { quantity: 10, unit: 'set', piecesPerPack: 4, dispatchUnit: 'pc' },
        ],
      }),
    ).toBe('Total 80 pcs and 20 sets');
    expect(
      formatPackingSlipTotal({
        lines: [{ quantity: 10, unit: 'set', piecesPerPack: null, dispatchUnit: 'pc' }],
      }),
    ).toBe('Total 10 sets');
  });

  it('captions match trader example', () => {
    const caps = orderLineBillingCaptions({
      quantity: 10,
      rate: 100,
      unit: 'set',
      piecesPerPack: 4,
      dispatchUnit: 'pc',
    });
    expect(caps).toEqual([
      '1 set = 4 pcs',
      'price per pc = ₹100',
      'order = 10 sets = 40 pcs',
      '₹4,000',
    ]);
    expect(
      lineBillAmount({ quantity: 10, rate: 100, unit: 'set', piecesPerPack: 4 }),
    ).toBe(4000);
  });

  it('omits ₹ and pcs when pack size blank', () => {
    const caps = orderLineBillingCaptions({
      quantity: 10,
      rate: 100,
      unit: 'set',
      piecesPerPack: null,
      dispatchUnit: 'pc',
    });
    expect(caps).toEqual(['price per pc = ₹100', 'order = 10 sets']);
  });
});
