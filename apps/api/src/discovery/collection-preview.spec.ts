import { describe, expect, it } from 'vitest';
import { collectionPreviewFromRow } from './collection-preview';

describe('collectionPreviewFromRow', () => {
  it('uses cover plus product images, deduped, max 4 previews', () => {
    const preview = collectionPreviewFromRow({
      coverImage: 'https://img/cover',
      products: [
        { product: { images: ['https://img/a', 'https://img/b'] } },
        { product: { images: ['https://img/a', 'https://img/c'] } },
        { product: { images: ['https://img/d', 'https://img/e'] } },
      ],
    });
    // cover + a,b,c,d,e (a deduped) = 6
    expect(preview.imageCount).toBe(6);
    expect(preview.previewImages).toEqual([
      'https://img/cover',
      'https://img/a',
      'https://img/b',
      'https://img/c',
    ]);
    // WhatsApp +N uses imageCount - 3 when imageCount > 4
    expect(preview.imageCount - 3).toBe(3);
  });

  it('handles cover-only collections', () => {
    const preview = collectionPreviewFromRow({ coverImage: 'https://img/cover' });
    expect(preview.previewImages).toEqual(['https://img/cover']);
    expect(preview.imageCount).toBe(1);
  });

  it('handles empty media', () => {
    const preview = collectionPreviewFromRow({ coverImage: null, products: [] });
    expect(preview.previewImages).toEqual([]);
    expect(preview.imageCount).toBe(0);
  });
});
