import { describe, expect, it } from 'vitest';
import {
  howManyLineExtra,
  howManyLineMeta,
  howManyOrderFooterSummary,
  howManySetContentsMissing,
  howManySetsBanner,
  howManySoldAs,
  howManyTotalPcsLabel,
  howManyUnitShort,
  qtyCountNoun,
  qtyStepperUnitLabel,
} from './howManyLineMeta';

describe('howManyLineMeta', () => {
  it('says how a set or dozen is sold', () => {
    expect(howManySoldAs('set')).toBe('Set');
    expect(howManySoldAs('set', 6)).toBe('Set · 6 pcs');
    expect(howManySoldAs('dozen')).toBe('Dozen · 12 pcs');
    expect(howManySoldAs('mtr')).toBe('Metre');
  });

  it('builds sell facts with rate per dispatch when pack', () => {
    expect(
      howManyLineMeta({
        unit: 'set',
        dispatchUnit: 'pc',
        piecesPerPack: 6,
        moq: 12,
        rate: 800,
        rateMax: null,
      }),
    ).toBe('Set · 6 pcs · min 12 · ₹800/pc');
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
    expect(howManyLineExtra({ unit: 'set', piecesPerPack: 4, rate: 640 })).toBe(
      '4 pcs · ₹640/pc',
    );
  });

  it('totals pcs for sets when pcs-per-set is known', () => {
    expect(howManyTotalPcsLabel(5, 'set', 4)).toBe('Total 20 pcs');
    expect(howManyTotalPcsLabel(5, 'set', null)).toBeNull();
    expect(howManyTotalPcsLabel(null, 'set', 4)).toBeNull();
    expect(howManyTotalPcsLabel(2, 'pc', 4)).toBeNull();
    expect(howManyTotalPcsLabel(2, 'dozen', null)).toBe('Total 24 pcs');
    expect(qtyCountNoun('set')).toBe('sets');
    expect(qtyCountNoun('pc')).toBe('pieces');
    expect(qtyStepperUnitLabel('set')).toBe('Sets');
  });

  it('flags missing set contents', () => {
    expect(howManySetContentsMissing('set', null)).toBe('Set contents not mentioned');
    expect(howManySetContentsMissing('set', 6)).toBeNull();
    expect(howManySetContentsMissing('pc', null)).toBeNull();
  });

  it('banner and footer for sets vs native', () => {
    expect(howManySetsBanner([{ unit: 'set', dispatchUnit: 'pc' }])).toBe(
      'You order in sets. Rates and dispatch are per pc.',
    );
    expect(howManySetsBanner([{ unit: 'pc' }])).toBeNull();
    expect(
      howManyOrderFooterSummary([
        { quantity: 2, unit: 'set', piecesPerPack: 6, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ primary: '2 sets = 12 pcs' });
    expect(
      howManyOrderFooterSummary([{ quantity: 2, unit: 'set', piecesPerPack: null }]),
    ).toEqual({
      primary: '2 sets',
      hint: 'No piece total — set contents not mentioned on some designs.',
    });
    expect(howManyOrderFooterSummary([{ quantity: 2, unit: 'pc' }])).toEqual({
      primary: '2 pieces',
    });
  });
});
