import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import { leftoverOfferFromCatalogStatus } from './leftover-offer';

describe('leftoverOfferFromCatalogStatus', () => {
  it('marks draft, archived, and missing catalog rows', () => {
    expect(leftoverOfferFromCatalogStatus('p1', ProductStatus.Draft)).toBe('No longer available');
    expect(leftoverOfferFromCatalogStatus('p1', ProductStatus.Archived)).toBe(
      'No longer available',
    );
    expect(leftoverOfferFromCatalogStatus('p1', null)).toBe('No longer available');
  });

  it('leaves a live design and a line with no catalog id', () => {
    expect(leftoverOfferFromCatalogStatus('p1', ProductStatus.Published)).toBeNull();
    expect(leftoverOfferFromCatalogStatus(null, ProductStatus.Draft)).toBeNull();
    expect(leftoverOfferFromCatalogStatus('p1', undefined)).toBeNull();
  });
});
