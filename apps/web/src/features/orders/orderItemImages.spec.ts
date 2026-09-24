import { describe, expect, it } from 'vitest';
import {
  galleryIndexForItem,
  orderItemGalleryCaptions,
  orderItemGalleryDetails,
  orderItemGalleryUrls,
  orderLinePhotoInfo,
  urlsForOrderItem,
} from './orderItemImages';

const item = (
  id: string,
  image: string | null,
  images: string[] = [],
): { id: string; image: string | null; images: string[] } => ({
  id,
  image,
  images,
});

describe('orderItemImages', () => {
  it('collects images from array or legacy image field', () => {
    expect(urlsForOrderItem(item('a', 'legacy.jpg', []) as never)).toEqual(['legacy.jpg']);
    expect(urlsForOrderItem(item('b', null, ['one.jpg', 'two.jpg']) as never)).toEqual([
      'one.jpg',
      'two.jpg',
    ]);
  });

  it('builds a flat gallery and finds line index', () => {
    const items = [
      item('l1', 'a.jpg', ['a.jpg']),
      item('l2', 'b.jpg', []),
      item('l3', null, ['c.jpg', 'c2.jpg']),
    ] as never[];
    expect(orderItemGalleryUrls(items)).toEqual(['a.jpg', 'b.jpg', 'c.jpg', 'c2.jpg']);
    expect(galleryIndexForItem(items, 'l3')).toBe(2);
  });

  it('repeats name and qty × rate for each photo on a line', () => {
    const line = {
      id: 'l1',
      name: 'Floral voile',
      sku: 'EK-AB12',
      quantity: 200,
      rate: 85,
      unit: 'pc',
      image: null,
      images: ['one.jpg', 'two.jpg'],
    };
    expect(orderLinePhotoInfo(line)).toEqual({
      caption: 'Floral voile',
      detail: '200 × ₹85/pc · EK-AB12',
    });
    expect(orderItemGalleryCaptions([line as never])).toEqual(['Floral voile', 'Floral voile']);
    expect(orderItemGalleryDetails([line as never])).toEqual([
      '200 × ₹85/pc · EK-AB12',
      '200 × ₹85/pc · EK-AB12',
    ]);
  });
});
