import { describe, expect, it } from 'vitest';
import {
  TRADE_FILTER_STATUSES,
  tradeKindLabel,
  tradeMenuFilterSummary,
  tradeStatusLabel,
} from './ordersFilterConfig';

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

  it('still labels legacy delivered when filtered', () => {
    expect(tradeStatusLabel('delivered')).toBe('Delivered');
  });

  it('does not offer Delivered in the primary menu list', () => {
    expect(TRADE_FILTER_STATUSES.some((row) => row.status === 'delivered')).toBe(false);
    expect(TRADE_FILTER_STATUSES.some((row) => row.status === 'dispatched')).toBe(true);
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
