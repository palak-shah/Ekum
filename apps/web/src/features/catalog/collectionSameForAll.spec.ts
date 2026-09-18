import { describe, expect, it } from 'vitest';
import {
  applySameForAllToForm,
  emptySameForAll,
  memberDiffersFromSameForAll,
  productFieldsFromMember,
} from './collectionSameForAll';

describe('memberDiffersFromSameForAll', () => {
  it('is false when same-for-all is empty', () => {
    expect(
      memberDiffersFromSameForAll(
        {
          name: 'A',
          rate: '900',
          unit: 'pc',
          moq: '',
          notes: '',
          categories: [],
        },
        emptySameForAll(),
      ),
    ).toBe(false);
  });

  it('detects rate mismatch', () => {
    expect(
      memberDiffersFromSameForAll(
        {
          name: 'A',
          rate: '900',
          unit: 'pc',
          moq: '100',
          notes: '',
          categories: [],
        },
        { ...emptySameForAll('pc'), rate: '1200', moq: '100' },
      ),
    ).toBe(true);
  });
});

describe('applySameForAllToForm', () => {
  it('fills only non-empty shared fields', () => {
    expect(
      applySameForAllToForm(
        {
          name: 'Keep',
          rate: '1',
          unit: 'pc',
          moq: '',
          notes: 'old',
          categories: ['A'],
        },
        { categories: ['B'], rate: '1200-1400', unit: 'mtr', moq: '50', notes: '' },
      ),
    ).toEqual({
      name: 'Keep',
      rate: '1200-1400',
      unit: 'mtr',
      moq: '50',
      notes: 'old',
      categories: ['B'],
    });
  });
});

describe('productFieldsFromMember', () => {
  it('parses range into rate and rateMax', () => {
    expect(
      productFieldsFromMember({
        name: 'X',
        rate: '1200-1400',
        unit: 'pc',
        moq: '10',
        notes: 'silk',
        categories: [],
      }),
    ).toEqual({
      description: 'silk',
      rate: 1200,
      rateMax: 1400,
      unit: 'pc',
      moq: 10,
      categories: undefined,
    });
  });
});
