import { describe, expect, it } from 'vitest';
import {
  HOME_CATALOGUE_COLLECTION_PREVIEW,
  HOME_CATALOGUE_DESIGN_PREVIEW,
  cataloguePreviewSlice,
  homeCatalogueSlice,
  seeAllCatalogueLabel,
} from './homeCataloguePreview';

describe('cataloguePreviewSlice', () => {
  it('caps profile-face preview and leaves the catalogue page whole', () => {
    const rows = [1, 2, 3, 4, 5];
    expect(cataloguePreviewSlice(rows, HOME_CATALOGUE_COLLECTION_PREVIEW, true)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(cataloguePreviewSlice(rows, HOME_CATALOGUE_DESIGN_PREVIEW, true)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(cataloguePreviewSlice(rows, HOME_CATALOGUE_COLLECTION_PREVIEW, false)).toEqual(rows);
    expect(homeCatalogueSlice(rows, HOME_CATALOGUE_COLLECTION_PREVIEW, true)).toEqual([
      1, 2, 3, 4,
    ]);
  });
});

describe('seeAllCatalogueLabel', () => {
  it('is tab-aware', () => {
    expect(seeAllCatalogueLabel('collections')).toBe('See all collections >');
    expect(seeAllCatalogueLabel('designs')).toBe('See all designs >');
  });
});
