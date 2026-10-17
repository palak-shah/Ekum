import { describe, expect, it } from 'vitest';
import {
  howManyLineExtra,
  howManyLineMeta,
  howManyOrderFooterSummary,
  howManyPackContentsLabel,
  howManyPackSizesDiffer,
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
    expect(howManySoldAs('set', 5, 'mtr')).toBe('Set · 5 mtrs');
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
        unit: 'set',
        dispatchUnit: 'mtr',
        piecesPerPack: 5,
        rate: 94,
        rateMax: null,
      }),
    ).toBe('Set · 5 mtrs · ₹94/mtr');
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
    expect(howManyLineExtra({ unit: 'set', piecesPerPack: 4, rate: 640 })).toBe('₹2,560');
    expect(howManyLineExtra({ unit: 'set', piecesPerPack: 1, rate: 1100 })).toBe('₹1,100');
  });

  it('totals pcs for sets when pcs-per-set is known', () => {
    expect(howManyTotalPcsLabel(5, 'set', 4)).toBe('Total 5 sets = 20 pcs');
    expect(howManyTotalPcsLabel(30, 'set', 1)).toBe('Total 30 sets = 30 pcs');
    expect(howManyTotalPcsLabel(5, 'set', null)).toBeNull();
    expect(howManyTotalPcsLabel(null, 'set', 4)).toBeNull();
    expect(howManyTotalPcsLabel(2, 'pc', 4)).toBeNull();
    expect(howManyTotalPcsLabel(2, 'dozen', null)).toBe('Total 2 dozens = 24 pcs');
    expect(qtyCountNoun('set')).toBe('sets');
    expect(qtyCountNoun('pc')).toBe('pieces');
    expect(qtyStepperUnitLabel('set')).toBe('Sets');
  });

  it('shows pack size on a line only when sizes on the sheet differ', () => {
    expect(howManyPackContentsLabel('set', 20, 'pc')).toBe('20 pcs');
    expect(howManyPackContentsLabel('set', 4, 'pc')).toBe('4 pcs');
    expect(howManyPackContentsLabel('set', null, 'pc')).toBeNull();
    expect(
      howManyPackSizesDiffer([
        { unit: 'set', piecesPerPack: 20 },
        { unit: 'set', piecesPerPack: 4 },
      ]),
    ).toBe(true);
    expect(
      howManyPackSizesDiffer([
        { unit: 'set', piecesPerPack: 4 },
        { unit: 'set', piecesPerPack: 4 },
      ]),
    ).toBe(false);
  });

  it('flags missing set contents', () => {
    expect(howManySetContentsMissing('set', null)).toBe('Set contents not mentioned');
    expect(howManySetContentsMissing('set', 6)).toBeNull();
    expect(howManySetContentsMissing('pc', null)).toBeNull();
  });

  it('banner and footer for sets vs native', () => {
    expect(howManySetsBanner([{ unit: 'set', dispatchUnit: 'pc' }])).toBe(
      'Rates are per pc. Order and dispatch per set.',
    );
    expect(howManySetsBanner([{ unit: 'set', dispatchUnit: 'set' }])).toBe(
      'Rates are per pc. Order and dispatch per set.',
    );
    expect(howManySetsBanner([{ unit: 'set', dispatchUnit: 'mtr' }])).toBe(
      'Rates are per mtr. Order per set. Dispatch per mtr.',
    );
    expect(howManySetsBanner([{ unit: 'pc' }])).toBeNull();
    expect(
      howManyOrderFooterSummary([
        { quantity: 2, unit: 'set', piecesPerPack: 6, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ primary: '2 sets = 12 pcs' });
    expect(
      howManyOrderFooterSummary([
        {
          quantity: 10,
          unit: 'set',
          piecesPerPack: 4,
          dispatchUnit: 'pc',
          rate: 100,
        },
      ]),
    ).toEqual({ primary: '10 sets = 40 pcs', money: '₹4,000' });
    expect(
      howManyOrderFooterSummary([{ quantity: 2, unit: 'set', piecesPerPack: null }]),
    ).toEqual({ primary: '2 sets' });
    expect(
      howManyOrderFooterSummary([
        { quantity: 30, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' },
        { quantity: 30, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' },
        { quantity: 30, unit: 'set', piecesPerPack: 2, dispatchUnit: 'pc' },
        { quantity: 30, unit: 'set', piecesPerPack: 3, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ primary: '120 sets = 210 pcs' });
    expect(
      howManyOrderFooterSummary([
        { quantity: 30, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' },
        { quantity: 30, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ primary: '60 sets = 60 pcs' });
    expect(howManyOrderFooterSummary([{ quantity: 2, unit: 'pc' }])).toEqual({
      primary: '2 pieces',
    });
  });
});
