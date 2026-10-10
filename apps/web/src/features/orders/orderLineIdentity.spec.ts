import { describe, expect, it } from 'vitest';
import { orderLineIdentitySecondary, orderLineSoldAsCue } from './orderLineIdentity';

describe('orderLineSoldAsCue', () => {
  it('uses per mtr for plain units — not /mtr on the Price box', () => {
    expect(orderLineSoldAsCue('mtr')).toBe('per mtr');
    expect(orderLineSoldAsCue('pc')).toBe('per pc');
  });

  it('keeps Set · N pcs when pack size is known', () => {
    expect(orderLineSoldAsCue('set', 12)).toBe('Set · 12 pcs');
  });
});

describe('orderLineIdentitySecondary', () => {
  it('joins SKU and sold-as when set size is known', () => {
    expect(
      orderLineIdentitySecondary({
        sku: 'EK-204',
        productId: 'prod-long-id',
        unit: 'set',
        piecesPerPack: 12,
      }),
    ).toBe('EK-204 · Set · 12 pcs');
  });

  it('falls back to productId and per-unit cue', () => {
    expect(
      orderLineIdentitySecondary({
        sku: null,
        productId: 'abcdefghijklmnop',
        unit: 'pc',
      }),
    ).toBe('abcdefghij… · per pc');
  });
});
