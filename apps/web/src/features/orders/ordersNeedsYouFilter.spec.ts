import { describe, expect, it } from 'vitest';
import { tradeMenuFilterSummary } from './ordersFilterConfig';

describe('Needs you filter (not a chip)', () => {
  it('summarises Needs you in the filter chrome only', () => {
    expect(
      tradeMenuFilterSummary({
        statusFacet: null,
        kindFacet: null,
        dateFacet: null,
        needsYou: true,
      }),
    ).toBe('Needs you');
  });

  it('does not invent a Needs you status chip label in the summary without the flag', () => {
    expect(
      tradeMenuFilterSummary({
        statusFacet: null,
        kindFacet: null,
        dateFacet: null,
      }),
    ).toBe('');
  });
});
