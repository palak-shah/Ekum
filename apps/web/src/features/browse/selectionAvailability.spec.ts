import { describe, expect, it } from 'vitest';
import {
  reasonFromApiError,
  reasonFromCollectionStatus,
  reasonFromProductStatus,
  selectionListDesignChrome,
} from './selectionAvailability';
import { CURATE_NOT_VISIBLE_REASON, curateBlockReason } from './curateCheck';
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

describe('selectionListDesignChrome', () => {
  it('does not paint curate-check NOT_DISCOVERABLE as list copy', () => {
    expect(curateBlockReason('NOT_DISCOVERABLE')).toBe(CURATE_NOT_VISIBLE_REASON);
    const chrome = selectionListDesignChrome({
      discoveryUnavailable: false,
      packReason: null,
    });
    expect(chrome.packLocked).toBe(false);
    expect(chrome.reason).toBeUndefined();
    expect(chrome.reason).not.toBe(CURATE_NOT_VISIBLE_REASON);
  });

  it('keeps pack-lock and discovery reasons on the list', () => {
    expect(
      selectionListDesignChrome({
        discoveryUnavailable: false,
        packReason: "Can't put in a pack",
      }),
    ).toEqual({ packLocked: true, reason: "Can't put in a pack" });
    expect(
      selectionListDesignChrome({
        discoveryUnavailable: true,
        availabilityReason: 'No longer available',
        packReason: "Can't put in a pack",
      }),
    ).toEqual({ packLocked: false, reason: 'No longer available' });
  });
});
