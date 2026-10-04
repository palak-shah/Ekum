import { describe, expect, it } from 'vitest';
import {
  howManyLineExtra,
  howManyLineMeta,
  howManySoldAs,
  howManyTotalPcsLabel,
  howManyUnitShort,
  qtyCountNoun,
} from './howManyLineMeta';

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
    expect(howManyUnitShort('pc')).toBe('Piece');
    expect(howManyLineExtra({ unit: 'pc' })).toBeNull();
    expect(howManyLineExtra({ unit: 'set', piecesPerPack: 4 })).toBe('4 pcs');
  });

  it('totals pcs for sets when pcs-per-set is known', () => {
    expect(howManyTotalPcsLabel(5, 'set', 4)).toBe('Total 20 pcs');
    expect(howManyTotalPcsLabel(5, 'set', null)).toBeNull();
    expect(howManyTotalPcsLabel(null, 'set', 4)).toBeNull();
    expect(howManyTotalPcsLabel(2, 'pc', 4)).toBeNull();
    expect(howManyTotalPcsLabel(2, 'dozen', null)).toBe('Total 24 pcs');
    expect(qtyCountNoun('set')).toBe('sets');
    expect(qtyCountNoun('pc')).toBe('pieces');
  });
});
