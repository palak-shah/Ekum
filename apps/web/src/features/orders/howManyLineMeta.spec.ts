import { describe, expect, it } from 'vitest';
import {
  howManyLineExtra,
  howManyLineMeta,
  howManyOrderFooterSummary,
  ticketTotalSummary,
  ticketLineSkipReason,
  ticketTotalMissingCue,
  howManyPackContentsLabel,
  howManyPackSizesDiffer,
  howManySetContentsMissing,
  howManySetsBanner,
  howManySoldAs,
  howManyTotalPcsLabel,
  howManyUnitShort,
  groupHowManyByOrderUnit,
  lastGroupedItem,
  howManyOrderUnitsMixed,
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
    expect(howManyLineExtra({ unit: 'set', piecesPerPack: 4, rate: 640 })).toBe('₹640/pc');
    expect(howManyLineExtra({ unit: 'set', piecesPerPack: 1, rate: 1100 })).toBe('₹1,100/pc');
    expect(
      howManyLineExtra({
        unit: 'set',
        dispatchUnit: 'mtr',
        piecesPerPack: 39,
        rate: 91,
      }),
    ).toBe('₹91/mtr');
    expect(
      howManyLineExtra({
        unit: 'set',
        dispatchUnit: 'set',
        catalogRateUnit: 'mtr',
        piecesPerPack: 47,
        rate: 91,
      }),
    ).toBe('₹91/mtr');
    expect(
      howManyLineExtra({
        unit: 'set',
        dispatchUnit: 'mtr',
        piecesPerPack: 39,
        rate: 91,
      }),
    ).not.toBe('₹3,549');
  });

  it('totals pcs for sets when pcs-per-set is known', () => {
    expect(howManyTotalPcsLabel(5, 'set', 4)).toBe('Total 5 sets = 20 pcs');
    expect(howManyTotalPcsLabel(30, 'set', 1)).toBe('Total 30 sets = 30 pcs');
    expect(howManyTotalPcsLabel(5, 'set', null)).toBeNull();
    expect(howManyTotalPcsLabel(null, 'set', 4)).toBeNull();
    expect(howManyTotalPcsLabel(2, 'pc', 4)).toBeNull();
    expect(howManyTotalPcsLabel(2, 'dozen', null)).toBe('Total 2 dozen = 24 pcs');
    expect(qtyCountNoun('set')).toBe('sets');
    expect(qtyCountNoun('pc')).toBe('pcs');
    expect(qtyCountNoun('mtr')).toBe('mtrs');
    expect(qtyStepperUnitLabel('set')).toBe('Sets');
  });

  it('restacks mixed units: pack first, pick order inside the group', () => {
    const grouped = groupHowManyByOrderUnit(
      [
        { id: 'mtr-a', unit: 'mtr' },
        { id: 'set-a', unit: 'set' },
        { id: 'mtr-b', unit: 'mtr' },
        { id: 'set-b', unit: 'set' },
      ],
      (row) => row.unit,
    );
    expect(grouped.map((g) => g.label)).toEqual(['Sets', 'Mtrs']);
    expect(grouped[0]!.items.map((row) => row.id)).toEqual(['set-a', 'set-b']);
    expect(grouped[1]!.items.map((row) => row.id)).toEqual(['mtr-a', 'mtr-b']);
    expect(
      lastGroupedItem(
        [
          { id: 'mtr-a', unit: 'mtr' },
          { id: 'set-a', unit: 'set' },
          { id: 'mtr-b', unit: 'mtr' },
          { id: 'set-b', unit: 'set' },
        ],
        (row) => row.unit,
      )?.id,
    ).toBe('mtr-b');
    expect(howManyOrderUnitsMixed([{ unit: 'set' }, { unit: 'set' }])).toBe(false);
    expect(howManyOrderUnitsMixed([{ unit: 'set' }, { unit: 'mtr' }])).toBe(true);
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

  it('flags missing set contents only when the sheet is mixed', () => {
    expect(howManySetContentsMissing('set', null)).toBeNull();
    expect(howManySetContentsMissing('set', null, false)).toBeNull();
    expect(howManySetContentsMissing('set', null, true)).toBe('Set contents not mentioned');
    expect(howManySetContentsMissing('set', 6, true)).toBeNull();
    expect(howManySetContentsMissing('pc', null, true)).toBeNull();
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
    expect(
      howManySetsBanner([{ unit: 'set', dispatchUnit: 'set', catalogRateUnit: 'mtr' }]),
    ).toBe('Rates are per mtr. Order and dispatch per set.');
    expect(howManySetsBanner([{ unit: 'pc' }])).toBeNull();
    expect(
      howManyOrderFooterSummary([
        { quantity: 2, unit: 'set', piecesPerPack: 6, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ rows: ['2 sets = 12 pcs'] });
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
    ).toEqual({ rows: ['10 sets = 40 pcs'], money: '₹4,000' });
    expect(
      howManyOrderFooterSummary([{ quantity: 2, unit: 'set', piecesPerPack: null }]),
    ).toEqual({ rows: ['2 sets'] });
    expect(
      howManyOrderFooterSummary([
        {
          quantity: 3,
          unit: 'set',
          dispatchUnit: 'mtr',
          piecesPerPack: null,
          rate: 91,
        },
      ]),
    ).toEqual({ rows: ['3 sets'] });
    expect(
      howManyOrderFooterSummary([
        {
          quantity: 3,
          unit: 'set',
          dispatchUnit: 'mtr',
          piecesPerPack: 39,
          rate: 91,
        },
      ]),
    ).toEqual({ rows: ['3 sets = 117 mtrs'], money: '₹10,647' });
    expect(
      howManyOrderFooterSummary([
        { quantity: 30, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' },
        { quantity: 30, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' },
        { quantity: 30, unit: 'set', piecesPerPack: 2, dispatchUnit: 'pc' },
        { quantity: 30, unit: 'set', piecesPerPack: 3, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ rows: ['120 sets = 210 pcs'] });
    expect(
      howManyOrderFooterSummary([
        { quantity: 30, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' },
        { quantity: 30, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc' },
      ]),
    ).toEqual({ rows: ['60 sets = 60 pcs'] });
    expect(howManyOrderFooterSummary([{ quantity: 2, unit: 'pc' }])).toEqual({
      rows: ['2 pcs'],
    });
    expect(howManyOrderFooterSummary([{ quantity: 70, unit: 'mtr', rate: 111 }])).toEqual({
      rows: ['70 mtrs'],
      money: '₹7,770',
    });
    expect(
      howManyOrderFooterSummary([
        { quantity: 10, unit: 'set', piecesPerPack: 4, dispatchUnit: 'pc', rate: 100 },
        { quantity: 5, unit: 'mtr', rate: 50 },
      ]),
    ).toEqual({
      rows: ['10 sets = 40 pcs', '5 mtrs'],
      money: '₹4,250',
    });
    expect(
      howManyOrderFooterSummary([
        { quantity: 10, unit: 'set', piecesPerPack: 4, dispatchUnit: 'pc', rate: 100 },
        { quantity: 5, unit: 'mtr' },
      ]),
    ).toEqual({ rows: ['10 sets = 40 pcs', '5 mtrs'] });
    expect(
      howManyOrderFooterSummary(
        [{ quantity: 12, unit: 'set', piecesPerPack: 1, dispatchUnit: 'pc', rate: 120 }],
        { packConversion: false },
      ),
    ).toEqual({ rows: ['12 sets'], money: '₹1,440' });
  });

  it('ticket Total: per-unit ₹ then All when mixed and billable', () => {
    expect(
      ticketTotalSummary([
        { quantity: 50, unit: 'set', piecesPerPack: 1, rate: 1290 },
        { quantity: 50, unit: 'set', piecesPerPack: 1, rate: 1290 },
        { quantity: 50, unit: 'pc', rate: 100 },
      ]),
    ).toEqual({
      units: [
        { unit: 'set', qty: '100 sets = 100 pcs', money: '₹1,29,000' },
        { unit: 'pc', qty: '50 pcs', money: '₹5,000' },
      ],
      grand: '₹1,34,000',
      missingCue: null,
    });
    expect(
      ticketTotalSummary([
        { quantity: 50, unit: 'set', piecesPerPack: 1, rate: 1290 },
        { quantity: 50, unit: 'set', piecesPerPack: 1 },
        { quantity: 50, unit: 'pc', rate: 100 },
      ]),
    ).toEqual({
      units: [
        { unit: 'set', qty: '100 sets = 100 pcs', money: '₹64,500' },
        { unit: 'pc', qty: '50 pcs', money: '₹5,000' },
      ],
      grand: '₹69,500',
      missingCue: 'Missing rates',
    });
    expect(
      ticketTotalSummary([
        { quantity: 10, unit: 'set', piecesPerPack: 4, dispatchUnit: 'pc', rate: 100 },
        { quantity: 5, unit: 'mtr' },
      ]),
    ).toEqual({
      units: [
        { unit: 'set', qty: '10 sets = 40 pcs', money: '₹4,000' },
        { unit: 'mtr', qty: '5 mtrs', money: null },
      ],
      grand: '₹4,000',
      missingCue: 'Missing rates',
    });
    expect(
      ticketTotalSummary([
        { quantity: 10, unit: 'mtr', rate: 128 },
        { quantity: 10, unit: 'mtr', rate: 160 },
      ]),
    ).toEqual({
      units: [{ unit: 'mtr', qty: '20 mtrs', money: '₹2,880' }],
      grand: null,
      missingCue: null,
    });
    expect(
      ticketTotalSummary([
        { quantity: 10, unit: 'mtr', rate: 128 },
        { quantity: 10, unit: 'mtr', rate: 160, lineStatus: 'declined' },
      ]),
    ).toEqual({
      units: [{ unit: 'mtr', qty: '10 mtrs', money: '₹1,280' }],
      grand: null,
      missingCue: null,
    });
    expect(ticketLineSkipReason({ quantity: 10, unit: 'set', rate: 100 })).toBe('pack');
    expect(ticketTotalMissingCue([{ quantity: 10, unit: 'set', rate: 100 }])).toBeNull();
    expect(
      ticketTotalMissingCue([
        { quantity: 10, unit: 'mtr' },
        { quantity: 5, unit: 'mtr' },
      ]),
    ).toBeNull();
    expect(
      ticketTotalSummary([
        { quantity: 10, unit: 'mtr' },
        { quantity: 5, unit: 'pc' },
      ]),
    ).toEqual({
      units: [
        { unit: 'mtr', qty: '10 mtrs', money: null },
        { unit: 'pc', qty: '5 pcs', money: null },
      ],
      grand: null,
      missingCue: null,
    });
    expect(
      ticketTotalSummary([{ quantity: 10, unit: 'set', rate: 100 }]),
    ).toEqual({
      units: [{ unit: 'set', qty: '10 sets', money: null }],
      grand: null,
      missingCue: null,
    });
    expect(
      ticketTotalSummary([
        {
          quantity: 3,
          unit: 'set',
          dispatchUnit: 'mtr',
          piecesPerPack: null,
          rate: 91,
        },
      ]),
    ).toEqual({
      units: [{ unit: 'set', qty: '3 sets', money: null }],
      grand: null,
      missingCue: null,
    });
    expect(
      ticketTotalSummary([
        { quantity: 10, unit: 'set', piecesPerPack: 4, dispatchUnit: 'pc', rate: 100 },
        { quantity: 5, unit: 'set', rate: 100 },
      ]),
    ).toEqual({
      units: [{ unit: 'set', qty: '15 sets', money: '₹4,000' }],
      grand: null,
      missingCue: 'No pcs in a set',
    });
    expect(
      ticketTotalSummary([
        { quantity: 20, unit: 'set', rate: 640 },
        { quantity: 20, unit: 'set', rate: 750 },
        { quantity: 100, unit: 'pc', rate: 100 },
      ]),
    ).toEqual({
      units: [
        { unit: 'set', qty: '40 sets', money: null },
        { unit: 'pc', qty: '100 pcs', money: '₹10,000' },
      ],
      grand: '₹10,000',
      missingCue: 'No pcs in a set',
    });
  });
});
