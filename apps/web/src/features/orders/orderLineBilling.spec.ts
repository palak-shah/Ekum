import { describe, expect, it } from 'vitest';
import { catalogBunchBill, lineBillAmount } from '@ekum/domain-types';
import {
  formatDualQty,
  formatOrderQty,
  formatPackingSlipTotal,
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
    expect(
      formatDualQty({ quantity: 50, unit: 'set', piecesPerPack: 1, dispatchUnit: 'set' }),
    ).toBe('50 sets');
    expect(
      formatDualQty({ quantity: 27, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' }),
    ).toBe('27 sets');
    expect(formatOrderQty({ quantity: 10, unit: 'set' })).toBe('10 sets');
    expect(formatOrderQty({ quantity: 70, unit: 'mtr' })).toBe('70 mtrs');
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
    expect(
      formatPackingSlipTotal({
        lines: [
          { quantity: 50, unit: 'set', piecesPerPack: 1, dispatchUnit: 'set' },
          { quantity: 27, unit: 'set', piecesPerPack: 1, dispatchUnit: 'set' },
        ],
      }),
    ).toBe('Total 77 sets');
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
    // Price per pc, order/dispatch in sets: 2 sets × 2 pcs × ₹100 = ₹400.
    expect(
      lineBillAmount({ quantity: 2, rate: 100, unit: 'set', piecesPerPack: 2 }),
    ).toBe(400);
  });

  it('catalogBunchBill is per design for pc/mtr and equals member sum', () => {
    expect(
      catalogBunchBill({
        quantity: 1,
        rate: 450,
        unit: 'pc',
        catalogRateUnit: 'pc',
        memberCount: 9,
      }),
    ).toBe(4050);
    const one = lineBillAmount({ quantity: 1, rate: 450, unit: 'pc' });
    expect(one).toBe(450);
    expect(one! * 9).toBe(4050);
    expect(
      catalogBunchBill({
        quantity: 1,
        rate: 450,
        unit: 'set',
        catalogRateUnit: 'pc',
        piecesPerPack: 4,
        memberCount: 9,
      }),
    ).toBe(16200);
  });

  it('catalogBunchBill is qty × rate when Rate per is set/box/bundle', () => {
    expect(
      catalogBunchBill({
        quantity: 2,
        rate: 5000,
        unit: 'set',
        catalogRateUnit: 'set',
        piecesPerPack: 4,
        memberCount: 9,
      }),
    ).toBe(10000);
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
