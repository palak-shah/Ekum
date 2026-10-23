import { describe, expect, it } from 'vitest';
import {
  applyDesignRateUnit,
  designCategoryLockedByPack,
  designEditorCategories,
  designMasterCategoryId,
} from './designEditorDefaults';

describe('design editor defaults', () => {
  it('appends collection tags onto the design’s own tags', () => {
    expect(
      designEditorCategories(['Kurti'], [{ categories: ['Sarees'], masterCategoryId: 'cat-1' }]),
    ).toEqual(['Kurti', 'Sarees']);
  });

  it('applies collection tags when the design has none', () => {
    expect(
      designEditorCategories([], [
        { categories: ['Sarees', 'Festive'], masterCategoryId: null },
        { categories: ['Sarees', 'Bridal'], masterCategoryId: null },
      ]),
    ).toEqual(['Sarees', 'Festive', 'Bridal']);
  });

  it('uses the collection master category, else the only shop category', () => {
    expect(
      designMasterCategoryId([{ masterCategoryId: 'pack-cat' }], ['shop-cat']),
    ).toBe('pack-cat');
    expect(designMasterCategoryId([], ['shop-cat'])).toBe('shop-cat');
    expect(designMasterCategoryId([], ['a', 'b'])).toBeNull();
    expect(designMasterCategoryId([], ['a', 'b'], 'own-cat')).toBe('own-cat');
    expect(
      designMasterCategoryId([{ masterCategoryId: 'pack-cat' }], ['shop-cat'], 'own-cat'),
    ).toBe('pack-cat');
    expect(designCategoryLockedByPack([{ masterCategoryId: 'pack-cat' }])).toBe(true);
    expect(designCategoryLockedByPack([{ masterCategoryId: null }])).toBe(false);
  });

  it('defaults a set order to rate per pc without writing pc onto dispatch', () => {
    expect(applyDesignRateUnit('set', 'pc', 'set')).toEqual({
      unit: 'set',
      dispatchUnit: 'set',
      catalogRateUnit: 'pc',
    });
    expect(applyDesignRateUnit('set', 'mtr', 'set')).toEqual({
      unit: 'set',
      dispatchUnit: 'set',
      catalogRateUnit: 'mtr',
    });
    expect(applyDesignRateUnit('set', 'mtr', 'kg')).toEqual({
      unit: 'set',
      dispatchUnit: 'kg',
      catalogRateUnit: 'mtr',
    });
    expect(applyDesignRateUnit('pc', 'mtr', 'pc')).toEqual({
      unit: 'mtr',
      dispatchUnit: 'pc',
      catalogRateUnit: 'mtr',
    });
  });
});
