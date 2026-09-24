import { describe, expect, it } from 'vitest';
import { howManyLineMeta, howManySoldAs } from './howManyLineMeta';

describe('howManyLineMeta', () => {
  it('says how a set or dozen is sold', () => {
    expect(howManySoldAs('set')).toBe('Set');
    expect(howManySoldAs('set', 6)).toBe('Set · 6 pcs');
    expect(howManySoldAs('dozen')).toBe('Dozen · 12 pcs');
    expect(howManySoldAs('mtr')).toBe('Metre');
  });

  it('builds sell facts without tags or on-request', () => {
    expect(
      howManyLineMeta({
        unit: 'set',
        piecesPerPack: 6,
        moq: 12,
        rate: 800,
        rateMax: null,
      }),
    ).toBe('Set · 6 pcs · min 12 · ₹800/set');
    expect(
      howManyLineMeta({
        unit: 'pc',
        moq: null,
        rate: null,
        rateMax: null,
      }),
    ).toBe('Piece');
  });
});
