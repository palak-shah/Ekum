import { describe, expect, it } from 'vitest';
import {
  addVisible,
  allVisibleSelected,
  clearExploreFilterParams,
  facetSummary,
  filterStartsWithPreserveOrder,
  pinSelectedOnOpen,
  removeVisible,
  titleCaseLabel,
  toggleValue,
} from './exploreFilterPanel';

describe('pinSelectedOnOpen', () => {
  it('puts applied selected first in their array order, then the rest A-Z', () => {
    expect(pinSelectedOnOpen(['cotton', 'silk', 'sarees', 'jeans'], ['sarees', 'cotton'])).toEqual([
      'sarees',
      'cotton',
      'jeans',
      'silk',
    ]);
  });

  it('ignores selected values that are not in the pool', () => {
    expect(pinSelectedOnOpen(['sarees', 'silk'], ['missing', 'silk'])).toEqual(['silk', 'sarees']);
  });
});

describe('filterStartsWithPreserveOrder', () => {
  it('keeps session order and matches starts-with on label or raw value', () => {
    const session = ['sarees', 'silk', 'salwar suits'];
    expect(filterStartsWithPreserveOrder(session, 's')).toEqual(['sarees', 'silk', 'salwar suits']);
    expect(filterStartsWithPreserveOrder(session, 'sa')).toEqual(['sarees', 'salwar suits']);
    expect(filterStartsWithPreserveOrder(session, 'Su')).toEqual([]);
  });

  it('returns the full frozen list when the query is empty', () => {
    expect(filterStartsWithPreserveOrder(['b', 'a'], '')).toEqual(['b', 'a']);
  });
});

describe('draft select', () => {
  it('toggles membership without reordering the rest of the draft array beyond add/remove', () => {
    expect(toggleValue(['sarees'], 'silk')).toEqual(['sarees', 'silk']);
    expect(toggleValue(['sarees', 'silk'], 'sarees')).toEqual(['silk']);
  });

  it('Select all adds visible only; Deselect all removes visible only', () => {
    expect(addVisible(['silk'], ['sarees', 'cotton'])).toEqual(['silk', 'sarees', 'cotton']);
    expect(removeVisible(['silk', 'sarees', 'cotton'], ['sarees'])).toEqual(['silk', 'cotton']);
    expect(allVisibleSelected(['silk', 'sarees'], ['sarees'])).toBe(true);
    expect(allVisibleSelected(['silk'], ['sarees'])).toBe(false);
  });
});

describe('clearExploreFilterParams', () => {
  it('drops show and story in one pass so Businesses Only actually clears', () => {
    const next = clearExploreFilterParams(
      new URLSearchParams('show=businesses&side=buying&story=co1'),
    );
    expect(next.get('show')).toBeNull();
    expect(next.get('story')).toBeNull();
    expect(next.get('side')).toBe('buying');
  });
});

describe('facetSummary / titleCaseLabel', () => {
  it('summarizes empty, one, and many', () => {
    expect(facetSummary([], 'Any category')).toBe('Any category');
    expect(facetSummary(['sarees'], 'Any category')).toBe('Sarees');
    expect(facetSummary(['sarees', 'silk'], 'Any category')).toBe('Sarees + 1');
  });

  it('title-cases labels', () => {
    expect(titleCaseLabel('salwar suits')).toBe('Salwar Suits');
  });
});
