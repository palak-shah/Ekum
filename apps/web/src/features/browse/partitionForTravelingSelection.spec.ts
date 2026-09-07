import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import { SELECTION_NEEDS_PUBLISHED_TOAST } from './selectionEligibility';
import { partitionForTravelingSelection } from './partitionForTravelingSelection';

describe('partitionForTravelingSelection', () => {
  it('keeps only published and toasts when all skipped', () => {
    const rows = [
      { id: '1', status: ProductStatus.Draft },
      { id: '2', status: ProductStatus.Archived },
    ];
    const result = partitionForTravelingSelection(rows);
    expect(result.published).toEqual([]);
    expect(result.skipped).toBe(2);
    expect(result.toast).toBe(SELECTION_NEEDS_PUBLISHED_TOAST);
  });

  it('adds published and notes skipped drafts', () => {
    const rows = [
      { id: '1', status: ProductStatus.Published },
      { id: '2', status: ProductStatus.Draft },
    ];
    const result = partitionForTravelingSelection(rows);
    expect(result.published.map((r) => r.id)).toEqual(['1']);
    expect(result.skipped).toBe(1);
    expect(result.toast).toBe('Skipped 1 that isn’t published.');
  });
});
