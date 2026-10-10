import { describe, expect, it } from 'vitest';
import {
  catalogSearchMatches,
  designFindParts,
  designMatchesFind,
  designRateFindTokens,
  designRateMatchesQuery,
  designTagMatchesQuery,
} from './catalogSearch';

describe('catalogSearchMatches', () => {
  it('keeps every row when the field is empty or spaces', () => {
    expect(catalogSearchMatches('', 'Banarasi Silk')).toBe(true);
    expect(catalogSearchMatches('   ', 'Banarasi Silk')).toBe(true);
  });

  it('matches name, sku, tags, and pack names case-insensitively', () => {
    expect(catalogSearchMatches('banarasi', 'Banarasi Silk Saree', 'EK-1', ['saree'])).toBe(
      true,
    );
    expect(catalogSearchMatches('ek-1', 'Banarasi Silk Saree', 'EK-1')).toBe(true);
    expect(catalogSearchMatches('wedding', 'Silk', null, ['Wedding 2026'])).toBe(true);
    expect(catalogSearchMatches('zzzz', 'Banarasi Silk Saree')).toBe(false);
  });

  it('matches notes, shop, and rate from designFindParts', () => {
    const parts = designFindParts({
      name: 'Kurta 2',
      sku: 'K-2',
      description: '44 inch cotton',
      categories: ['Festive'],
      companyName: 'Ahmedabad Loom Co',
      unit: 'set',
      rate: 1200,
    });
    expect(catalogSearchMatches('cotton', ...parts)).toBe(true);
    expect(catalogSearchMatches('festive', ...parts)).toBe(true);
    expect(catalogSearchMatches('ahmedabad', ...parts)).toBe(true);
    expect(catalogSearchMatches('1200', ...parts)).toBe(true);
    expect(catalogSearchMatches('₹1,200', ...parts)).toBe(true);
    expect(catalogSearchMatches('1200/set', ...parts)).toBe(true);
    expect(catalogSearchMatches('k-2', ...parts)).toBe(true);
  });

  it('matches mill shop names on a pack haystack', () => {
    expect(
      catalogSearchMatches('yash', 'Festive 2026', 'Wedding', 'Yash Fabrics'),
    ).toBe(true);
  });
});

describe('designMatchesFind', () => {
  const chiffon = {
    name: 'Chiffon Roll',
    sku: 'FAB-CH-05',
    categories: ['Fabric'],
    unit: 'mtr',
    rate: 128,
  };
  const saree = {
    name: 'Banarasi Silk Saree',
    sku: 'BNS-001',
    categories: ['Sarees', 'Bridal'],
    unit: 'pc',
    rate: 2450,
  };

  it('keeps every design when Find is empty', () => {
    expect(designMatchesFind('', chiffon)).toBe(true);
  });

  it('filters this pack to designs with the typed tag', () => {
    expect(designTagMatchesQuery('fabric', chiffon.categories)).toBe(true);
    expect(designMatchesFind('Fabric', chiffon)).toBe(true);
    expect(designMatchesFind('fabric', saree)).toBe(false);
    expect(designMatchesFind('bridal', saree)).toBe(true);
    expect(designMatchesFind('saree', saree)).toBe(true);
  });

  it('filters this pack to designs with the typed price', () => {
    expect(designRateMatchesQuery('128', 128, null, 'mtr')).toBe(true);
    expect(designMatchesFind('128', chiffon)).toBe(true);
    expect(designMatchesFind('₹128', chiffon)).toBe(true);
    expect(designMatchesFind('128/mtr', chiffon)).toBe(true);
    expect(designMatchesFind('128', saree)).toBe(false);
    expect(designMatchesFind('2450', saree)).toBe(true);
    expect(designRateFindTokens(128, null, 'mtr')).toEqual(
      expect.arrayContaining(['₹128/mtr', '128', '128/mtr']),
    );
  });

  it('matches a price inside a rate band', () => {
    expect(
      designMatchesFind('300', {
        name: 'Range cloth',
        categories: ['Fabric'],
        unit: 'mtr',
        rate: 280,
        rateMax: 445,
      }),
    ).toBe(true);
  });

  it('still finds by name when tags and rate do not match', () => {
    expect(designMatchesFind('chiffon', chiffon)).toBe(true);
    expect(designMatchesFind('banarasi', saree)).toBe(true);
  });
});
