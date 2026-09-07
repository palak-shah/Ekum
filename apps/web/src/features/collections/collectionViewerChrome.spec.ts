import { describe, expect, it } from 'vitest';
import { collectionViewerPrimaryAction } from './collectionViewerChrome';

describe('collectionViewerPrimaryAction', () => {
  it('gives owners Edit and visitors Bookmark', () => {
    expect(collectionViewerPrimaryAction(true)).toBe('edit');
    expect(collectionViewerPrimaryAction(false)).toBe('bookmark');
  });
});
