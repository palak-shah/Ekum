import { describe, expect, it } from 'vitest';
import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import {
  SELECTION_NEEDS_PUBLISHED_TOAST,
  isPublishedForSelection,
  isTradeableShortlistStatus,
  selectionSkipToast,
  tradeableShortlistEntries,
  travelingSelectionToggleGate,
} from './selectionEligibility';

describe('selectionEligibility', () => {
  it('allows only published', () => {
    expect(isPublishedForSelection(ProductStatus.Published)).toBe(true);
    expect(isPublishedForSelection(CollectionStatus.Published)).toBe(true);
    expect(isPublishedForSelection(ProductStatus.Draft)).toBe(false);
    expect(isPublishedForSelection(ProductStatus.Archived)).toBe(false);
    expect(isPublishedForSelection(CollectionStatus.Ready)).toBe(false);
  });

  it('builds skip toasts', () => {
    expect(selectionSkipToast(0, 2)).toBeNull();
    expect(selectionSkipToast(2, 0)).toBe(SELECTION_NEEDS_PUBLISHED_TOAST);
    expect(selectionSkipToast(1, 2)).toBe('Skipped 1 that isn’t published.');
    expect(selectionSkipToast(3, 1)).toBe('Skipped 3 that aren’t published.');
  });

  it('blocks draft add but allows remove', () => {
    expect(
      travelingSelectionToggleGate({ status: ProductStatus.Draft, alreadySelected: false }),
    ).toEqual({ allow: false, toast: SELECTION_NEEDS_PUBLISHED_TOAST });
    expect(
      travelingSelectionToggleGate({ status: ProductStatus.Draft, alreadySelected: true }),
    ).toEqual({ allow: true, toast: null });
    expect(
      travelingSelectionToggleGate({
        status: ProductStatus.Published,
        alreadySelected: false,
      }),
    ).toEqual({ allow: true, toast: null });
  });

  it('owner album Select may check drafts, not archived', () => {
    expect(
      travelingSelectionToggleGate({
        status: ProductStatus.Draft,
        alreadySelected: false,
        ownerAlbum: true,
      }),
    ).toEqual({ allow: true, toast: null });
    expect(
      travelingSelectionToggleGate({
        status: ProductStatus.Archived,
        alreadySelected: false,
        ownerAlbum: true,
      }),
    ).toEqual({ allow: false, toast: SELECTION_NEEDS_PUBLISHED_TOAST });
  });

  it('trade skips explicit drafts; legacy rows without status stay live', () => {
    expect(isTradeableShortlistStatus(undefined)).toBe(true);
    expect(isTradeableShortlistStatus(ProductStatus.Draft)).toBe(false);
    expect(
      tradeableShortlistEntries([
        { productId: 'live' },
        { productId: 'quiet', status: ProductStatus.Draft },
        { productId: 'out', status: ProductStatus.Published },
      ]),
    ).toEqual([{ productId: 'live' }, { productId: 'out', status: ProductStatus.Published }]);
  });
});
