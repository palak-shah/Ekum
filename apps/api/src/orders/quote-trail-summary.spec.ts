import { describe, expect, it } from 'vitest';
import { quoteTrailSummary } from '@ekum/domain-types';
import { isBareQuotedTrailSummary } from '@ekum/domain-types';

describe('quoteTrailSummary', () => {
  it('labels the first quote with the total', () => {
    expect(quoteTrailSummary(275000, false)).toBe('Quoted — ₹2,75,000');
  });

  it('labels a later send as Quote updated', () => {
    expect(quoteTrailSummary(283800, true)).toBe('Quote updated — ₹2,83,800');
  });

  it('treats null and plain Quoted as bare (legacy trail)', () => {
    expect(isBareQuotedTrailSummary(null)).toBe(true);
    expect(isBareQuotedTrailSummary('Quoted')).toBe(true);
    expect(isBareQuotedTrailSummary('Quoted — ₹2,75,000')).toBe(false);
    expect(isBareQuotedTrailSummary('Quote updated — ₹2,83,800')).toBe(false);
  });
});
