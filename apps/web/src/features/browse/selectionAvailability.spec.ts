import { beforeEach, describe, expect, it } from 'vitest';
import { reasonFromApiError, reasonFromCollectionStatus, reasonFromProductStatus } from './selectionAvailability';
import { ProductStatus, CollectionStatus } from '@ekum/domain-types';
import { ApiError } from '@/lib/apiClient';

describe('selectionAvailability reasons', () => {
  it('maps product lifecycle', () => {
    expect(reasonFromProductStatus(ProductStatus.Archived)).toBe('Archived');
    expect(reasonFromProductStatus(ProductStatus.Draft)).toBe('Not published');
    expect(reasonFromProductStatus(ProductStatus.Published)).toBeUndefined();
  });

  it('maps collection lifecycle', () => {
    expect(reasonFromCollectionStatus(CollectionStatus.Archived)).toBe('Archived');
    expect(reasonFromCollectionStatus(CollectionStatus.Draft)).toBe('Not published');
    expect(reasonFromCollectionStatus(CollectionStatus.Ready)).toBe('Not published');
    expect(reasonFromCollectionStatus(CollectionStatus.Published)).toBeUndefined();
  });

  it('maps API errors to plain copy', () => {
    expect(
      reasonFromApiError(
        new ApiError({ statusCode: 404, code: 'NOT_FOUND', message: 'Collection not found.' }),
      ),
    ).toBe('No longer available');
    expect(
      reasonFromApiError(
        new ApiError({ statusCode: 400, code: 'BAD', message: 'This design was archived.' }),
      ),
    ).toBe('Archived');
    expect(reasonFromApiError(new Error('boom'))).toBe('No longer available');
  });
});
