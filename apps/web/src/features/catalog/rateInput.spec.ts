import { describe, expect, it } from 'vitest';
import {
  formatRateInput,
  parseRateInput,
  rateFieldInputProps,
  sameForAllSummary,
  type SameForAllDetails,
} from './rateInput';

describe('parseRateInput', () => {
  it('returns nulls for blank', () => {
    expect(parseRateInput('')).toEqual({ rate: null, rateMax: null });
    expect(parseRateInput('   ')).toEqual({ rate: null, rateMax: null });
  });

  it('parses a single number', () => {
    expect(parseRateInput('1200')).toEqual({ rate: 1200, rateMax: null });
    expect(parseRateInput('1,200')).toEqual({ rate: 1200, rateMax: null });
  });

  it('parses a range with hyphen or en-dash', () => {
    expect(parseRateInput('1200-1400')).toEqual({ rate: 1200, rateMax: 1400 });
    expect(parseRateInput('1200–1400')).toEqual({ rate: 1200, rateMax: 1400 });
    expect(parseRateInput('1200 - 1400')).toEqual({ rate: 1200, rateMax: 1400 });
  });

  it('rejects inverted or invalid ranges as nulls', () => {
    expect(parseRateInput('1400-1200')).toEqual({ rate: null, rateMax: null });
    expect(parseRateInput('abc')).toEqual({ rate: null, rateMax: null });
  });
});

describe('formatRateInput', () => {
  it('formats single and range', () => {
    expect(formatRateInput(null, null)).toBe('');
    expect(formatRateInput(1200, null)).toBe('1200');
    expect(formatRateInput(1200, 1400)).toBe('1200-1400');
  });
});

describe('rateFieldInputProps', () => {
  it('uses text inputMode so phones can type a range dash', () => {
    expect(rateFieldInputProps.inputMode).toBe('text');
    expect(rateFieldInputProps.placeholder).toMatch(/1200-1400/);
  });
});

describe('sameForAllSummary', () => {
  const empty: SameForAllDetails = {
    categories: [],
    rate: '',
    unit: '',
    piecesPerPack: '',
    moq: '',
    notes: '',
  };

  it('returns null when nothing set', () => {
    expect(sameForAllSummary(empty)).toBeNull();
  });

  it('joins rate unit moq', () => {
    expect(
      sameForAllSummary({
        ...empty,
        rate: '1200-1400',
        unit: 'pc',
        moq: '100',
      }),
    ).toBe('1200-1400 · pc · MOQ 100');
  });

  it('counts tags so tags-only same-for-all is not empty', () => {
    expect(sameForAllSummary({ ...empty, categories: ['Festive'] })).toBe('Festive');
    expect(sameForAllSummary({ ...empty, categories: ['Festive', 'Saree'] })).toBe(
      'Festive +1',
    );
  });
});
