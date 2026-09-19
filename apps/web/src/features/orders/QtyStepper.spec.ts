import { describe, expect, it } from 'vitest';
import { parseQtyDraft, sameForAllChipLabel } from './QtyStepper';

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
  it('shows last applied qty on the idle chip', () => {
    expect(sameForAllChipLabel(200)).toBe('Same for all · 200');
  });
});
