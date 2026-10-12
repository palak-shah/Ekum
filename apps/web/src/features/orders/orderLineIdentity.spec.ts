import { describe, expect, it } from 'vitest';
import { orderLineIdentitySecondary, orderLineSoldAsCue } from './orderLineIdentity';

describe('orderLineSoldAsCue', () => {
  it('uses per mtr for plain units — not /mtr on the Price box', () => {
    expect(orderLineSoldAsCue('mtr')).toBe('per mtr');
    expect(orderLineSoldAsCue('pc')).toBe('per pc');
  });

  it('keeps Set · N pcs when pack size is known', () => {
    expect(orderLineSoldAsCue('set', 12)).toBe('Set · 12 pcs');
    expect(orderLineSoldAsCue('set', 5, 'mtr')).toBe('Set · 5 mtrs');
    expect(orderLineSoldAsCue('dozen')).toBe('Dozen · 12 pcs');
  });
});

describe('orderLineIdentitySecondary', () => {
  it('shows sold-as only — never repeats SKU under the name', () => {
    expect(
      orderLineIdentitySecondary({
        name: 'EK-CECC3ACB',
        sku: 'EK-CECC3ACB',
        unit: 'set',
        piecesPerPack: 5,
        dispatchUnit: 'pc',
      }),
    ).toBe('Set · 5 pcs');
    expect(
      orderLineIdentitySecondary({
        name: 'Sage Green 300Tc',
        sku: 'EK-DCF0B102',
        unit: 'set',
        piecesPerPack: 5,
        dispatchUnit: 'pc',
      }),
    ).toBe('Set · 5 pcs');
  });

  it('falls back to per-unit cue when native', () => {
    expect(
      orderLineIdentitySecondary({
        name: 'Cotton',
        sku: null,
        productId: 'abcdefghijklmnop',
        unit: 'pc',
      }),
    ).toBe('per pc');
  });
});
