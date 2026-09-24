import { describe, expect, it } from 'vitest';
import {
  applySameForAllToForm,
  collectSameForAllDiffIds,
  emptySameForAll,
  forceSameForAllToForm,
  memberDiffersFromSameForAll,
  productFieldsFromMember,
  sortDiffFirst,
  unionTags,
  unitAsksPiecesPerSet,
} from './collectionSameForAll';

describe('unitAsksPiecesPerSet', () => {
  it('is only for set', () => {
    expect(unitAsksPiecesPerSet('set')).toBe(true);
    expect(unitAsksPiecesPerSet('pc')).toBe(false);
    expect(unitAsksPiecesPerSet('box')).toBe(false);
  });
});

describe('unionTags', () => {
  it('amends only missing tags', () => {
    expect(unionTags(['Silk', 'Red'], ['silk', 'Wedding'])).toEqual(['Silk', 'Red', 'Wedding']);
  });
});

describe('memberDiffersFromSameForAll', () => {
  it('is false when same-for-all is empty', () => {
    expect(
      memberDiffersFromSameForAll(
        {
          name: 'A',
          rate: '900',
          unit: 'pc',
          piecesPerPack: '',
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
          piecesPerPack: '',
          moq: '100',
          notes: '',
          categories: [],
        },
        { ...emptySameForAll('pc'), rate: '1200', moq: '100' },
      ),
    ).toBe(true);
  });
});

describe('collectSameForAllDiffIds', () => {
  const shared = { ...emptySameForAll('pc'), rate: '1200', moq: '100' };

  it('returns empty when same-for-all is blank', () => {
    expect(
      collectSameForAllDiffIds(emptySameForAll(), [
        {
          id: 'a',
          form: {
            name: 'A',
            rate: '900',
            unit: 'pc',
            piecesPerPack: '',
            moq: '',
            notes: '',
            categories: [],
          },
        },
      ]).size,
    ).toBe(0);
  });

  it('marks only mismatched members', () => {
    const ids = collectSameForAllDiffIds(shared, [
      {
        id: 'same',
        form: {
          name: 'A',
          rate: '1200',
          unit: 'pc',
          piecesPerPack: '',
          moq: '100',
          notes: '',
          categories: [],
        },
      },
      {
        id: 'diff',
        form: {
          name: 'B',
          rate: '900',
          unit: 'pc',
          piecesPerPack: '',
          moq: '100',
          notes: '',
          categories: [],
        },
      },
    ]);
    expect([...ids]).toEqual(['diff']);
  });
});

describe('sortDiffFirst', () => {
  it('puts Diff ids first', () => {
    expect(
      sortDiffFirst(
        [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        new Set(['b', 'c']),
      ).map((x) => x.id),
    ).toEqual(['b', 'c', 'a']);
  });
});

describe('applySameForAllToForm', () => {
  it('does not overwrite existing rate/unit/notes; unions tags', () => {
    expect(
      applySameForAllToForm(
        {
          name: 'Keep',
          rate: '1',
          unit: 'pc',
          piecesPerPack: '',
          moq: '',
          notes: 'old',
          categories: ['A'],
        },
        {
          categories: ['B'],
          rate: '1200-1400',
          unit: 'mtr',
          piecesPerPack: '6',
          moq: '50',
          notes: 'new',
        },
      ),
    ).toEqual({
      name: 'Keep',
      rate: '1',
      unit: 'pc',
      piecesPerPack: '6',
      moq: '50',
      notes: 'old',
      categories: ['A', 'B'],
    });
  });

  it('forceSameForAll overwrites filled shared fields', () => {
    expect(
      forceSameForAllToForm(
        {
          name: 'Keep',
          rate: '1',
          unit: 'pc',
          piecesPerPack: '2',
          moq: '',
          notes: 'old',
          categories: ['A'],
        },
        {
          categories: ['B'],
          rate: '1200',
          unit: 'mtr',
          piecesPerPack: '6',
          moq: '50',
          notes: '',
        },
      ),
    ).toEqual({
      name: 'Keep',
      rate: '1200',
      unit: 'mtr',
      piecesPerPack: '6',
      moq: '50',
      notes: 'old',
      categories: ['A', 'B'],
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
        piecesPerPack: '6',
        moq: '10',
        notes: 'silk',
        categories: [],
      }),
    ).toEqual({
      description: 'silk',
      rate: 1200,
      rateMax: 1400,
      unit: 'pc',
      piecesPerPack: 6,
      moq: 10,
      categories: undefined,
    });
  });
});
