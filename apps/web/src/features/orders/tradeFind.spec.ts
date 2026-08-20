import { describe, expect, it } from 'vitest';
import {
  buildTradeSuggestions,
  dateFacetFromNeedle,
  relativeDateFacets,
  tradeMatchesFind,
  toDayString,
} from './tradeFind';
import type { TradeListItem } from './tradeList';

describe('tradeFind', () => {
  it('builds relative date facets with short labels', () => {
    const now = new Date(2026, 7, 18); // Aug 18
    const facets = relativeDateFacets(now);
    expect(facets.map((f) => f.label)).toEqual(['today', 'this week', 'last month']);
    expect(facets[0]).toMatchObject({ from: '2026-08-18', to: '2026-08-18' });
  });

  it('parses today yesterday and typed dates from search', () => {
    const now = new Date(2026, 7, 18);
    expect(dateFacetFromNeedle('today', now)?.from).toBe('2026-08-18');
    expect(dateFacetFromNeedle('yesterday', now)?.from).toBe('2026-08-17');
    expect(dateFacetFromNeedle('18/08', now)?.from).toBe('2026-08-18');
    expect(dateFacetFromNeedle('Jaipur', now)).toBeNull();
  });

  it('matches kind and status facets', () => {
    const sample: TradeListItem = {
      kind: 'sample',
      id: 's1',
      createdAt: '2026-08-18T10:00:00.000Z',
      direction: 'selling',
      sample: {
        id: 's1',
        status: 'requested',
        direction: 'selling',
        productId: null,
        name: 'Silk swatch',
        note: null,
        buyerCompanyId: 'b',
        sellerCompanyId: 's',
        counterpart: {
          id: 'b',
          name: 'Jaipur Emporium',
          city: 'Jaipur',
          logoUrl: null,
          verification: 'unverified',
        },
        dispatch: null,
        receivedAt: null,
        createdAt: '2026-08-18T10:00:00.000Z',
        updatedAt: '2026-08-18T10:00:00.000Z',
      },
    };
    expect(
      tradeMatchesFind(sample, {
        needle: '',
        kindFacet: 'sample',
        statusFacet: 'requested',
        dateFacet: null,
      }),
    ).toBe(true);
    expect(
      tradeMatchesFind(sample, {
        needle: 'requested',
        kindFacet: null,
        statusFacet: null,
        dateFacet: null,
      }),
    ).toBe(true);
    expect(
      tradeMatchesFind(sample, {
        needle: '',
        kindFacet: 'return',
        statusFacet: null,
        dateFacet: null,
      }),
    ).toBe(false);
  });

  it('suggests status first on empty focus', () => {
    const suggestions = buildTradeSuggestions([], '', new Date(2026, 7, 18));
    expect(suggestions.filter((s) => s.group === 'status').map((s) => s.label)).toEqual([
      'Requested',
      'Confirmed',
      'Dispatched',
      'Delivered',
    ]);
    expect(suggestions.some((s) => s.label === 'Sample')).toBe(true);
  });

  it('toDayString is local calendar', () => {
    expect(toDayString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
