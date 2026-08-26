import { describe, expect, it } from 'vitest';
import { orderBuilderPhotoDirty, orderBuilderStandardDirty } from './orderBuilderDirty';

describe('orderBuilderPhotoDirty', () => {
  it('is dirty when photos exist', () => {
    expect(
      orderBuilderPhotoDirty({
        uploading: false,
        note: '',
        photosCount: 2,
        sellerId: '',
      }),
    ).toBe(true);
  });

  it('is clean when empty', () => {
    expect(
      orderBuilderPhotoDirty({
        uploading: false,
        note: '',
        photosCount: 0,
        sellerId: '',
      }),
    ).toBe(false);
  });
});

describe('orderBuilderStandardDirty', () => {
  it('is dirty when qty changed from initial', () => {
    expect(
      orderBuilderStandardDirty({
        uploading: false,
        note: '',
        sellerId: '',
        sellerFromUrl: 's1',
        lines: [{ productId: 'p1', quantity: '200' }],
        initialQuantities: { p1: '100' },
      }),
    ).toBe(true);
  });
});
