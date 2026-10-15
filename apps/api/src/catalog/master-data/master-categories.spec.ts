import { describe, expect, it } from 'vitest';
import {
  MasterCategorySlug,
  Unit,
  migrateSuperCategoriesToMaster,
  sheetUnitToUnit,
} from '@ekum/domain-types';

describe('migrateSuperCategoriesToMaster', () => {
  it('expands mens apparel into ethnic and western', () => {
    expect(migrateSuperCategoriesToMaster(['mens_apparel'])).toEqual([
      MasterCategorySlug.MensReadymadeEthnic,
      MasterCategorySlug.MensReadymadeWestern,
    ]);
  });

  it('clears others without inventing jobwork', () => {
    expect(migrateSuperCategoriesToMaster(['others'])).toEqual([]);
  });

  it('passes through master slugs', () => {
    expect(migrateSuperCategoriesToMaster(['jobwork'])).toEqual([
      MasterCategorySlug.Jobwork,
    ]);
  });
});

describe('sheetUnitToUnit', () => {
  it('maps sheet tokens', () => {
    expect(sheetUnitToUnit('PCS')).toBe(Unit.Piece);
    expect(sheetUnitToUnit('MTR')).toBe(Unit.Metre);
    expect(sheetUnitToUnit('KGS')).toBe(Unit.Kilogram);
    expect(sheetUnitToUnit('KG')).toBe(Unit.Kilogram);
  });
});
