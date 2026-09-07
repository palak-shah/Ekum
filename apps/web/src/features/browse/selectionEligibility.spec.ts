import { describe, expect, it } from 'vitest';
import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import {
  SELECTION_NEEDS_PUBLISHED_TOAST,
  isPublishedForSelection,
  selectionSkipToast,
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
});
