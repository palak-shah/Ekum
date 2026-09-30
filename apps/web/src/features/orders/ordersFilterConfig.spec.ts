import { describe, expect, it } from 'vitest';
import {
  TRADE_FILTER_STATUSES,
  TRADE_FILTER_TYPES,
  statusFitsTab,
  statusFromParam,
  tabForTradeStatus,
  tradeKindLabel,
  tradeMenuFilterSummary,
  tradeStatusLabel,
  tradeStatusesForTab,
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

  it('offers only the six order statuses — no return/sample words', () => {
    expect(TRADE_FILTER_STATUSES.map((row) => row.status)).toEqual([
      'requested',
      'confirmed',
      'part_shipped',
      'dispatched',
      'settled',
      'cancelled',
    ]);
    for (const extra of ['received', 'approved', 'resolved', 'declined', 'converted']) {
      expect(TRADE_FILTER_STATUSES.some((row) => row.status === extra)).toBe(false);
    }
  });
});

describe('tradeStatusesForTab', () => {
  it('splits statuses by Pending / Completed', () => {
    expect(tradeStatusesForTab('pending').map((row) => row.status)).toEqual([
      'requested',
      'confirmed',
      'part_shipped',
    ]);
    expect(tradeStatusesForTab('completed').map((row) => row.status)).toEqual([
      'dispatched',
      'settled',
      'cancelled',
    ]);
  });

  it('does not treat return tokens as a tab status', () => {
    expect(statusFromParam('received')).toBeNull();
    expect(tabForTradeStatus('declined')).toBeNull();
    expect(statusFitsTab('requested', 'pending')).toBe(true);
    expect(statusFitsTab('dispatched', 'pending')).toBe(false);
  });
});

describe('tradeKindLabel', () => {
  it('returns All types when unset', () => {
    expect(tradeKindLabel(null)).toBe('All types');
  });

  it('returns label for known kind', () => {
    expect(tradeKindLabel('sample')).toBe('Sample');
    expect(TRADE_FILTER_TYPES.map((row) => row.kind)).toEqual(['order', 'sample']);
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
