import { describe, expect, it } from 'vitest';
import { parseQuoteRateDraft, ratesWithSharedValue, sanitizeQuoteRateInput } from './quoteSameRate';
import { sameForAllRateChipLabel } from './QtyStepper';

describe('ratesWithSharedValue', () => {
  it('copies one rate onto every line', () => {
    expect(ratesWithSharedValue(['a', 'b', 'c'], '120')).toEqual({
      a: '120',
      b: '120',
      c: '120',
    });
  });

  it('restores defaults when shared rate is cleared', () => {
    expect(
      ratesWithSharedValue(['a', 'b'], '', { a: '90', b: '110' }),
    ).toEqual({ a: '90', b: '110' });
  });

  it('uses empty string when cleared and no default', () => {
    expect(ratesWithSharedValue(['a'], '  ', {})).toEqual({ a: '' });
  });
});

describe('parseQuoteRateDraft', () => {
  it('accepts a real rupee rate', () => {
    expect(parseQuoteRateDraft('120')).toBe('120');
    expect(parseQuoteRateDraft('1,250')).toBe('1250');
  });

  it('rejects a range — quote is one rupee', () => {
    expect(parseQuoteRateDraft('80-90')).toBeNull();
    expect(parseQuoteRateDraft('80–90')).toBeNull();
  });

  it('rejects empty and zero', () => {
    expect(parseQuoteRateDraft('')).toBeNull();
    expect(parseQuoteRateDraft('0')).toBeNull();
  });
});

describe('sanitizeQuoteRateInput', () => {
  it('keeps digits and drops a typed range', () => {
    expect(sanitizeQuoteRateInput('1,250')).toBe('1250');
    expect(sanitizeQuoteRateInput('80-90')).toBe('80');
  });
});

describe('sameForAllRateChipLabel', () => {
  it('stays quiet until a rate is applied', () => {
    expect(sameForAllRateChipLabel('')).toBe('Same for all');
    expect(sameForAllRateChipLabel('0')).toBe('Same for all');
    expect(sameForAllRateChipLabel('85')).toBe('Same for all · ₹85');
  });
});
