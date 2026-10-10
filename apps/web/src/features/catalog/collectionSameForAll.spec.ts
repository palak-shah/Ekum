import { describe, expect, it } from 'vitest';
import {
  applySameForAllToForm,
  designFollowsPackRate,
  designHasOwnRate,
  stampCreatePhotoMemberForm,
  unanimousMemberRate,
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
  it('is for packed order units', () => {
    expect(unitAsksPiecesPerSet('set')).toBe(true);
    expect(unitAsksPiecesPerSet('dozen')).toBe(true);
    expect(unitAsksPiecesPerSet('pc')).toBe(false);
    expect(unitAsksPiecesPerSet('box')).toBe(true);
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
          dispatchUnit: '',
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
          dispatchUnit: '',
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
            dispatchUnit: '',
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
          dispatchUnit: '',
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
          dispatchUnit: '',
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
          dispatchUnit: '',
          piecesPerPack: '',
          moq: '',
          notes: 'old',
          categories: ['A'],
        },
        {
          categories: ['B'],
          rate: '1200-1400',
          unit: 'mtr',
          dispatchUnit: 'mtr',
          piecesPerPack: '6',
          moq: '50',
          notes: 'new',
        },
      ),
    ).toEqual({
      name: 'Keep',
      rate: '1',
      unit: 'pc',
      dispatchUnit: 'mtr',
      piecesPerPack: '6',
      moq: '50',
      notes: 'old',
      categories: ['A', 'B'],
    });
  });

  it('forceSameForAll overwrites units but keeps the design’s own rate', () => {
    expect(
      forceSameForAllToForm(
        {
          name: 'Keep',
          rate: '1',
          unit: 'pc',
          dispatchUnit: '',
          piecesPerPack: '2',
          moq: '',
          notes: 'old',
          categories: ['A'],
        },
        {
          categories: ['B'],
          rate: '1200',
          unit: 'mtr',
          dispatchUnit: 'mtr',
          piecesPerPack: '6',
          moq: '50',
          notes: '',
        },
      ),
    ).toEqual({
      name: 'Keep',
      rate: '1',
      unit: 'mtr',
      dispatchUnit: 'mtr',
      piecesPerPack: '6',
      moq: '50',
      notes: 'old',
      categories: ['A', 'B'],
    });
  });
});

describe('stampCreatePhotoMemberForm', () => {
  const emptyPhoto = {
    name: 'New',
    rate: '',
    unit: 'set',
    dispatchUnit: 'pc',
    piecesPerPack: '',
    moq: '',
    notes: '',
    categories: [] as string[],
  };
  const pack = {
    categories: [] as string[],
    rate: '1200-1400',
    unit: 'set',
    dispatchUnit: 'pc',
    piecesPerPack: '4',
    moq: '20',
    notes: '',
  };

  it('fills empty photo rate/range from pack at save (photos added before rate)', () => {
    expect(stampCreatePhotoMemberForm(emptyPhoto, pack, false).rate).toBe('1200-1400');
    expect(stampCreatePhotoMemberForm(emptyPhoto, pack, false).piecesPerPack).toBe('4');
  });

  it('keeps a design’s own rate when Apply is off', () => {
    expect(
      stampCreatePhotoMemberForm({ ...emptyPhoto, rate: '900' }, pack, false).rate,
    ).toBe('900');
  });

  it('keeps a design’s own rate when Apply is on', () => {
    expect(
      stampCreatePhotoMemberForm({ ...emptyPhoto, rate: '900' }, pack, true).rate,
    ).toBe('900');
    expect(
      stampCreatePhotoMemberForm({ ...emptyPhoto, rate: '900' }, pack, true).piecesPerPack,
    ).toBe('4');
  });
});

describe('designHasOwnRate', () => {
  it('is true only when rate is set', () => {
    expect(designHasOwnRate(1200)).toBe(true);
    expect(designHasOwnRate(0)).toBe(true);
    expect(designHasOwnRate(null)).toBe(false);
    expect(designHasOwnRate(undefined)).toBe(false);
  });
});

describe('designFollowsPackRate', () => {
  it('follows when empty or still on the previous pack rate', () => {
    expect(designFollowsPackRate({ rate: null }, '1200')).toBe(true);
    expect(designFollowsPackRate({ rate: 1200, rateMax: null }, '1200')).toBe(true);
    expect(designFollowsPackRate({ rate: 1200, rateMax: 1400 }, '1200-1400')).toBe(true);
  });

  it('does not follow a design-specific rate', () => {
    expect(designFollowsPackRate({ rate: 900, rateMax: null }, '1200')).toBe(false);
    expect(designFollowsPackRate({ rate: 1200, rateMax: null }, '')).toBe(false);
  });
});

describe('unanimousMemberRate', () => {
  it('returns the shared rate/range or empty when mixed', () => {
    expect(
      unanimousMemberRate([
        { rate: 1200, rateMax: 1400 },
        { rate: 1200, rateMax: 1400 },
      ]),
    ).toBe('1200-1400');
    expect(
      unanimousMemberRate([
        { rate: 1200, rateMax: null },
        { rate: 900, rateMax: null },
      ]),
    ).toBe('');
    expect(unanimousMemberRate([{ rate: null, rateMax: null }])).toBe('');
  });
});

describe('productFieldsFromMember', () => {
  it('parses range into rate and rateMax', () => {
    expect(
      productFieldsFromMember({
        name: 'X',
        rate: '1200-1400',
        unit: 'pc',
        dispatchUnit: 'pc',
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
      dispatchUnit: 'pc',
      piecesPerPack: 6,
      moq: 10,
      categories: undefined,
    });
  });
});
