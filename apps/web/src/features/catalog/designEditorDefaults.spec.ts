import { describe, expect, it } from 'vitest';
import {
  applyDesignRateUnit,
  designEditorCategories,
  designMasterCategoryId,
} from './designEditorDefaults';

describe('design editor defaults', () => {
  it('keeps the design tags when they are already set', () => {
    expect(
      designEditorCategories(['Kurti'], [{ categories: ['Sarees'], masterCategoryId: 'cat-1' }]),
    ).toEqual(['Kurti']);
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
  });

  it('defaults a set order to rate per pc without writing pc onto dispatch', () => {
    expect(applyDesignRateUnit('set', 'pc')).toEqual({ unit: 'set', dispatchUnit: 'set' });
    expect(applyDesignRateUnit('set', 'mtr')).toEqual({ unit: 'set', dispatchUnit: 'mtr' });
    expect(applyDesignRateUnit('pc', 'mtr')).toEqual({ unit: 'mtr', dispatchUnit: 'mtr' });
  });
});
