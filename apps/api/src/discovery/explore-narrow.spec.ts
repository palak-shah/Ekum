import { describe, expect, it } from 'vitest';
import { exploreNarrowFromQuery } from '@ekum/domain-types';
import { categoryHasSomeWhere, cityEqualsWhere, interestFromNarrowCategories } from './explore-narrow';

describe('exploreNarrowFromQuery', () => {
  it('prefers list params and falls back to single aliases', () => {
    expect(
      exploreNarrowFromQuery({ categories: ['sarees', 'silk'], city: 'Surat' }),
    ).toEqual({ categories: ['sarees', 'silk'], cities: ['Surat'] });
    expect(exploreNarrowFromQuery({ category: 'sarees', city: 'Jaipur' })).toEqual({
      categories: ['sarees'],
      cities: ['Jaipur'],
    });
  });
});

describe('cityEqualsWhere / categoryHasSomeWhere', () => {
  it('uses in for multiple cities', () => {
    expect(cityEqualsWhere(['Surat', 'Jaipur'])).toEqual({ city: { in: ['Surat', 'Jaipur'] } });
    expect(cityEqualsWhere(['Surat'])).toEqual({ city: 'Surat' });
  });

  it('ORs sell tags with super ids when present', () => {
    expect(categoryHasSomeWhere(['sarees'], 'sellCategories')).toEqual({
      sellCategories: { hasSome: ['sarees'] },
    });
  });
});

describe('interestFromNarrowCategories', () => {
  it('returns null when empty', () => {
    expect(interestFromNarrowCategories([])).toBeNull();
  });
});
