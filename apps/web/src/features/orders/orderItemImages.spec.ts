import { describe, expect, it } from 'vitest';
import {
  galleryIndexForItem,
  orderItemGalleryUrls,
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
});
