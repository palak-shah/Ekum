import { describe, expect, it } from 'vitest';
import {
  matchesCompanyInterest,
  resolveInterestFromCompany,
  resolveSuperCategoryId,
} from './interest-match';

describe('interest-match', () => {
  it('prefers buyCategories over supers when resolving interest', () => {
    const interest = resolveInterestFromCompany({
      buyCategories: ['Sarees'],
      superCategories: ['womens_apparel'],
    });
    expect(interest.preferFine).toBe(true);
    expect(interest.tags).toEqual(['Sarees']);
    expect(interest.supers).toEqual(['womens_apparel']);
  });

  it('falls back to supers when buyCategories are empty', () => {
    const interest = resolveInterestFromCompany({
      buyCategories: [],
      superCategories: ['womens_apparel'],
    });
    expect(interest.preferFine).toBe(false);
    expect(interest.tags).toEqual(['womens_apparel']);
  });

  it('matches fine sell tags', () => {
    const interest = resolveInterestFromCompany({
      buyCategories: ['Sarees'],
      superCategories: ['womens_apparel'],
    });
    expect(
      matchesCompanyInterest(
        { sellCategories: ['Sarees'], superCategories: ['mens_apparel'] },
        interest,
      ),
    ).toBe(true);
  });

  it('uses super overlap when viewer is on supers', () => {
    const interest = resolveInterestFromCompany({
      buyCategories: [],
      superCategories: ['womens_apparel'],
    });
    expect(
      matchesCompanyInterest(
        { sellCategories: ['Fabric'], superCategories: ['womens_apparel'] },
        interest,
      ),
    ).toBe(true);
  });

  it('uses super overlap when publisher has no sell tags', () => {
    const interest = resolveInterestFromCompany({
      buyCategories: ['Sarees'],
      superCategories: ['womens_apparel'],
    });
    expect(
      matchesCompanyInterest(
        { sellCategories: [], superCategories: ['womens_apparel'] },
        interest,
      ),
    ).toBe(true);
  });

  it('does not use supers when fine buyer faces a non-matching seller with sell tags', () => {
    const interest = resolveInterestFromCompany({
      buyCategories: ['Sarees'],
      superCategories: ['womens_apparel'],
    });
    expect(
      matchesCompanyInterest(
        { sellCategories: ['Fabric'], superCategories: ['womens_apparel'] },
        interest,
      ),
    ).toBe(false);
  });

  it('resolves super ids from labels', () => {
    expect(resolveSuperCategoryId('womens_apparel')).toBe('womens_apparel');
    expect(resolveSuperCategoryId("Women's apparel")).toBe('womens_apparel');
  });
});
