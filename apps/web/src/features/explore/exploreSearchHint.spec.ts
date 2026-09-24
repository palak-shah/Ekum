import { describe, expect, it } from 'vitest';
import { categoryDisplayLabel } from '@ekum/domain-types';
import { EXPLORE_SEARCH_HINT } from './exploreSearchHint';

describe('Explore search chrome (BM — client GST / raw category)', () => {
  it('uses one supplier-collection-design line and never GST', () => {
    expect(EXPLORE_SEARCH_HINT).toBe('Search supplier, collection or design');
    expect(EXPLORE_SEARCH_HINT.toLowerCase()).not.toContain('gst');
  });

  it('prints Women’s apparel not womens_apparel', () => {
    expect(categoryDisplayLabel('womens_apparel')).toBe("Women's apparel");
  });
});
