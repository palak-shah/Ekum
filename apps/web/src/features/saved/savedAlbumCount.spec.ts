import { describe, expect, it } from 'vitest';
import type { SavedItemView } from '@ekum/domain-types';
import { savedAlbumImageCount } from './savedAlbumCount';

const album = {
  kind: 'collection',
  imageCount: 4,
  productCount: 9,
} as SavedItemView;

describe('savedAlbumImageCount', () => {
  it('uses productCount so 9 designs show +6 on a 4-thumb mosaic', () => {
    expect(savedAlbumImageCount(album, ['a', 'b', 'c', 'd'])).toBe(9);
  });

  it('keeps a design’s own photo count', () => {
    expect(
      savedAlbumImageCount({ kind: 'product' } as SavedItemView, ['a', 'b']),
    ).toBe(2);
  });
});
