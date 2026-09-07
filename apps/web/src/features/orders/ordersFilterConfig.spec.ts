import { describe, expect, it } from 'vitest';
import { tradeKindLabel, tradeMenuFilterSummary, tradeStatusLabel } from './ordersFilterConfig';

describe('tradeMenuFilterSummary', () => {
  it('combines type and status labels', () => {
    expect(
      tradeMenuFilterSummary({
        statusFacet: 'requested',
        kindFacet: 'sample',
        dateFacet: null,
      }),
    ).toBe('Sample · Requested');
  });

  it('returns empty when no menu facets', () => {
    expect(
      tradeMenuFilterSummary({
        statusFacet: null,
        kindFacet: null,
        dateFacet: null,
      }),
    ).toBe('');
  });
});

describe('tradeStatusLabel', () => {
  it('returns Any status when unset', () => {
    expect(tradeStatusLabel(null)).toBe('Any status');
  });

  it('returns label for known status', () => {
    expect(tradeStatusLabel('requested')).toBe('Requested');
  });
});

describe('tradeKindLabel', () => {
  it('returns All types when unset', () => {
    expect(tradeKindLabel(null)).toBe('All types');
  });

  it('returns label for known kind', () => {
    expect(tradeKindLabel('sample')).toBe('Sample');
    expect(tradeKindLabel('trading')).toBe('Trading');
  });
});

describe('tradeMenuFilterSummary Trading', () => {
  it('shows Trading as the type', () => {
    expect(
      tradeMenuFilterSummary({
        statusFacet: null,
        kindFacet: 'trading',
        dateFacet: null,
      }),
    ).toBe('Trading');
  });
});
