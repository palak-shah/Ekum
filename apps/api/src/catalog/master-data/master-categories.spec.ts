import { describe, expect, it } from 'vitest';
import {
  MasterCategorySlug,
  Unit,
  migrateSuperCategoriesToMaster,
  orderedCategoryUnitsFromSheet,
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

describe('orderedCategoryUnitsFromSheet', () => {
  it('keeps sheet array order so primary is first (Readyset pc, Fabric/Jobwork mtr)', () => {
    expect(
      orderedCategoryUnitsFromSheet(['PCS', 'DOZEN', 'SET']).map((row) => row.unit),
    ).toEqual([Unit.Piece, Unit.Dozen, Unit.Set]);
    expect(orderedCategoryUnitsFromSheet(['MTR', 'KGS']).map((row) => row.unit)).toEqual([
      Unit.Metre,
      Unit.Kilogram,
    ]);
    expect(
      orderedCategoryUnitsFromSheet(['MTR', 'KG', 'PCS']).map((row) => row.unit),
    ).toEqual([Unit.Metre, Unit.Kilogram, Unit.Piece]);
  });

  it('skips duplicate mapped tokens and stamps sortOrder from first occurrence', () => {
    expect(orderedCategoryUnitsFromSheet(['MTR', 'MTR', 'PCS'])).toEqual([
      { unit: Unit.Metre, sortOrder: 0 },
      { unit: Unit.Piece, sortOrder: 1 },
    ]);
  });
});
