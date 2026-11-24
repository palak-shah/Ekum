import { describe, expect, it } from 'vitest';
import { parseQtyDraft, sameForAllChipLabel, seedSameForAllQty } from './QtyStepper';

describe('parseQtyDraft', () => {
  it('accepts typed wholesale counts', () => {
    expect(parseQtyDraft('200')).toBe(200);
    expect(parseQtyDraft('1,250')).toBe(1250);
    expect(parseQtyDraft(' 40 ')).toBe(40);
  });

  it('returns null while empty or invalid so the field stays editable', () => {
    expect(parseQtyDraft('')).toBeNull();
    expect(parseQtyDraft('abc')).toBeNull();
    expect(parseQtyDraft('0')).toBeNull();
  });
});

describe('sameForAllChipLabel', () => {
  it('is All until a count exists, then All: n unit', () => {
    expect(sameForAllChipLabel(null)).toBe('All');
    expect(sameForAllChipLabel(200)).toBe('All: 200');
    expect(sameForAllChipLabel(2, 'sets')).toBe('All: 2 sets');
  });
});

describe('seedSameForAllQty', () => {
  it('uses the last typed line qty before remembered shared', () => {
    expect(seedSameForAllQty([12, null, 8], 4)).toBe(8);
    expect(seedSameForAllQty([null, null], 8)).toBe(8);
    expect(seedSameForAllQty([], null)).toBeNull();
  });
});
