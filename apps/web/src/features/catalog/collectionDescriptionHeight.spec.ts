import { describe, expect, it } from 'vitest';
import {
  COLLECTION_DESC_MAX_PX,
  COLLECTION_DESC_MIN_PX,
  collectionDescriptionHeightPx,
} from './collectionDescriptionHeight';

describe('collectionDescriptionHeightPx', () => {
  it('floors empty/short content to one kit row', () => {
    expect(collectionDescriptionHeightPx(0)).toBe(COLLECTION_DESC_MIN_PX);
    expect(collectionDescriptionHeightPx(20)).toBe(COLLECTION_DESC_MIN_PX);
  });

  it('grows with content until the cap', () => {
    expect(collectionDescriptionHeightPx(48)).toBe(48);
    expect(collectionDescriptionHeightPx(COLLECTION_DESC_MAX_PX)).toBe(COLLECTION_DESC_MAX_PX);
    expect(collectionDescriptionHeightPx(COLLECTION_DESC_MAX_PX + 40)).toBe(COLLECTION_DESC_MAX_PX);
  });
});
