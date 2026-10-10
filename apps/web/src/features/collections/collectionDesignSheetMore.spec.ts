import { describe, expect, it } from 'vitest';
import { collectionDesignSheetMoreIds } from './collectionDesignSheetMore';

describe('collectionDesignSheetMoreIds', () => {
  it('own design: Edit then Remove', () => {
    expect(collectionDesignSheetMoreIds(true)).toEqual(['edit', 'remove']);
  });

  it('curated mill in own pack: Remove only', () => {
    expect(collectionDesignSheetMoreIds(false)).toEqual(['remove']);
  });
});
