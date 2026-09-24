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

  it('is clean when supplier is only the chat prefill', () => {
    expect(
      orderBuilderPhotoDirty({
        uploading: false,
        note: '',
        photosCount: 0,
        sellerId: 's1',
        sellerFromUrl: 's1',
      }),
    ).toBe(false);
  });

  it('is dirty when they change the prefilled supplier', () => {
    expect(
      orderBuilderPhotoDirty({
        uploading: false,
        note: '',
        photosCount: 0,
        sellerId: 's2',
        sellerFromUrl: 's1',
      }),
    ).toBe(true);
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
