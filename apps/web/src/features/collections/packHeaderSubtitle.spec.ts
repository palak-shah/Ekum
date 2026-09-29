import { describe, expect, it } from 'vitest';
import { designCardShopLine, packHeaderSubtitle, packRateBand } from './packHeaderSubtitle';

describe('packHeaderSubtitle', () => {
  it('adds a same-unit rate band (sr 16 T3)', () => {
    expect(
      packHeaderSubtitle(9, [
        { rate: 280, rateMax: null, unit: 'mtr' },
        { rate: 300, rateMax: 445, unit: 'mtr' },
        { rate: 400, rateMax: null, unit: 'mtr' },
      ]),
    ).toBe('9 designs · ₹280–₹445 /mtr');
  });

  it('stays count-only when rates are missing or units mix', () => {
    expect(packHeaderSubtitle(9, [])).toBe('9 designs');
    expect(packHeaderSubtitle(1, [{ rate: null, rateMax: null, unit: 'mtr' }])).toBe('1 design');
    expect(
      packRateBand([
        { rate: 280, unit: 'mtr' },
        { rate: 10, unit: 'pc' },
      ]),
    ).toBeNull();
  });
});

describe('designCardShopLine', () => {
  it('always names the shop; From only for curated foreign', () => {
    expect(designCardShopLine('Surat Silk House')).toBe('Surat Silk House');
    expect(designCardShopLine('Jaipur Emporium', true)).toBe('From Jaipur Emporium');
    expect(designCardShopLine('  ')).toBeNull();
  });
});
