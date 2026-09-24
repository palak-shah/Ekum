import { describe, expect, it } from 'vitest';
import { collectionPreviewFromRow } from './collection-preview';

describe('collectionPreviewFromRow', () => {
  it('uses the first photo of each design and ignores pack cover and extra shots', () => {
    const preview = collectionPreviewFromRow({
      coverImage: 'https://img/cover',
      products: [
        { product: { images: ['https://img/a', 'https://img/a-extra'] } },
        { product: { images: ['https://img/b'] } },
        { product: { images: ['https://img/c', 'https://img/c2'] } },
      ],
    });
    expect(preview.previewImages).toEqual([
      'https://img/a',
      'https://img/b',
      'https://img/c',
    ]);
    expect(preview.imageCount).toBe(3);
  });

  it('is empty when there are no member designs', () => {
    const preview = collectionPreviewFromRow({ coverImage: 'https://img/cover' });
    expect(preview.previewImages).toEqual([]);
    expect(preview.imageCount).toBe(0);
  });

  it('handles empty media', () => {
    const preview = collectionPreviewFromRow({ coverImage: null, products: [] });
    expect(preview.previewImages).toEqual([]);
    expect(preview.imageCount).toBe(0);
  });
});
