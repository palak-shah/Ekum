import { describe, expect, it } from 'vitest';
import {
  homeCatalogueSearchParam,
  homeCatalogueTabFromSearch,
  youBackHomeHref,
} from './homeCatalogueTab';

describe('homeCatalogueTab', () => {
  it('maps You products ↔ Home designs and restores Designs on Back', () => {
    expect(homeCatalogueTabFromSearch('products')).toBe('designs');
    expect(homeCatalogueTabFromSearch('designs')).toBe('designs');
    expect(homeCatalogueTabFromSearch('collections')).toBe('collections');
    expect(homeCatalogueTabFromSearch(null)).toBeNull();
    expect(homeCatalogueSearchParam('designs')).toBe('products');
    expect(youBackHomeHref('products')).toBe('/?tab=products');
    expect(youBackHomeHref('collections')).toBe('/?tab=collections');
    expect(youBackHomeHref(null)).toBe('/');
  });
});
