import { describe, expect, it } from 'vitest';
import { isPhoneLikeQuery } from './findOnEkumQuery';

describe('isPhoneLikeQuery', () => {
  it('treats 10-digit mobile as phone-like', () => {
    expect(isPhoneLikeQuery('9876543210')).toBe(true);
    expect(isPhoneLikeQuery('+91 98765 43210')).toBe(true);
  });

  it('rejects short or name queries', () => {
    expect(isPhoneLikeQuery('Surat')).toBe(false);
    expect(isPhoneLikeQuery('98')).toBe(false);
    expect(isPhoneLikeQuery('')).toBe(false);
  });
});
