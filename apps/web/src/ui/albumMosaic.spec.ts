import { describe, expect, it } from 'vitest';
import { albumOverflowLabel, collectionMosaicCount, designCountLabel } from './albumMosaic';

describe('collectionMosaicCount', () => {
  it('does not invent cells for fewer than four thumbs', () => {
    expect(collectionMosaicCount({ productCount: 5, previewCount: 2 })).toBe(2);
  });

  it('uses design count so five designs are not cover-plus-photos', () => {
    expect(collectionMosaicCount({ productCount: 5, previewCount: 4 })).toBe(5);
  });
});

describe('designCountLabel', () => {
  it('singularizes one design', () => {
    expect(designCountLabel(1)).toBe('1 design');
    expect(designCountLabel(0)).toBe('0 designs');
    expect(designCountLabel(2)).toBe('2 designs');
  });
});

describe('albumOverflowLabel', () => {
  it('shows leftover after four cells', () => {
    expect(albumOverflowLabel(4)).toBeNull();
    expect(albumOverflowLabel(5)).toBe('+1');
    expect(albumOverflowLabel(6)).toBe('+2');
  });
});
