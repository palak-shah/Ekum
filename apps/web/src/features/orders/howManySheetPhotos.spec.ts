import { describe, expect, it, vi } from 'vitest';
import {
  galleryIndexForProduct,
  howManyGalleryCaptions,
  howManyGalleryUrls,
  howManyPhotoInfo,
} from './howManySheetPhotos';

vi.mock('@/lib/mediaUrl', () => ({
  toAbsoluteMediaUrl: (url: string) => url,
}));

const p = (
  id: string,
  images: string[],
  extra: { name?: string; categories?: string[]; rate?: number | null; unit?: string | null } = {},
) =>
  ({
    id,
    name: extra.name ?? id,
    images,
    sku: null,
    categories: extra.categories ?? [],
    rate: extra.rate ?? 100,
    rateMax: null,
    unit: extra.unit ?? 'pc',
  }) as const;

describe('howManySheetPhotos', () => {
  it('builds a gallery and finds the first photo of a design', () => {
    const products = [p('a', ['a.jpg']), p('b', ['b1.jpg', 'b2.jpg'])];
    expect(howManyGalleryUrls(products)).toEqual(['a.jpg', 'b1.jpg', 'b2.jpg']);
    expect(galleryIndexForProduct(products, 'b')).toBe(1);
  });

  it('puts name in the caption and sold-as · rate in the detail', () => {
    expect(
      howManyPhotoInfo({
        name: 'Silk',
        sku: 'S1',
        rate: 1200,
        rateMax: null,
        unit: 'pc',
      }),
    ).toEqual({
      caption: 'Silk',
      detail: 'Piece · ₹1,200/pc · S1',
    });
  });

  it('repeats caption for each photo on a design', () => {
    const products = [p('a', ['a.jpg', 'a2.jpg'], { name: 'Silk' })];
    expect(howManyGalleryCaptions(products)).toEqual(['Silk', 'Silk']);
  });
});
