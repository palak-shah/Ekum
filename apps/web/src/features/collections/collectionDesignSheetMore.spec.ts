import { describe, expect, it } from 'vitest';
import { collectionDesignSheetMoreIds } from './collectionDesignSheetMore';

describe('collectionDesignSheetMoreIds', () => {
  it('own design: Edit · Remove · Delete', () => {
    expect(collectionDesignSheetMoreIds({ canEdit: true, canDelete: true })).toEqual([
      'edit',
      'remove',
      'delete',
    ]);
  });

  it('curated mill in own pack: Remove only', () => {
    expect(collectionDesignSheetMoreIds({ canEdit: false, canDelete: false })).toEqual([
      'remove',
    ]);
  });
});
