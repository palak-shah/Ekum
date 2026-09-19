import { describe, expect, it } from 'vitest';
import { orderLinePhotoTarget } from './orderLinePhotoTarget';

describe('orderLinePhotoTarget', () => {
  it('opens Explore design when the line has a product', () => {
    expect(orderLinePhotoTarget('p1')).toEqual({
      kind: 'product',
      href: '/explore/products/p1',
    });
  });

  it('falls back to gallery for photo-only lines', () => {
    expect(orderLinePhotoTarget(null)).toEqual({ kind: 'gallery' });
    expect(orderLinePhotoTarget(undefined)).toEqual({ kind: 'gallery' });
  });
});
