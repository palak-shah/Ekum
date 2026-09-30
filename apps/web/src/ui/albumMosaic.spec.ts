import { describe, expect, it } from 'vitest';
import {
  albumMediaAspectClass,
  albumOverflowLabel,
  collectionMosaicCount,
  designCountLabel,
  packFeedCaption,
  packFeedDetailLine,
} from './albumMosaic';

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

describe('packFeedCaption', () => {
  it('uses design count and date on a live pack', () => {
    expect(
      packFeedCaption({ live: true, productCount: 9, when: '9 Sept' }),
    ).toBe('9 designs · 9 Sept');
    expect(packFeedCaption({ live: true, productCount: 1, when: '7 Aug' })).toBe(
      '1 design · 7 Aug',
    );
  });

  it('uses status instead of From on a draft pack', () => {
    expect(
      packFeedCaption({
        live: false,
        productCount: 2,
        statusLine: 'Draft',
        when: '9 Sept',
      }),
    ).toBe('Draft · 9 Sept');
  });
});

describe('packFeedDetailLine', () => {
  it('joins tags and From when both exist', () => {
    expect(
      packFeedDetailLine({
        tags: ['Sarees', 'Bridal', 'Festive', 'Extra'],
        sourceLine: 'From Surat Silk House',
      }),
    ).toBe('Sarees · Bridal · Festive · From Surat Silk House');
  });

  it('is empty when there is nothing to show', () => {
    expect(packFeedDetailLine({ tags: [], sourceLine: null })).toBe('');
    expect(packFeedDetailLine({})).toBe('');
  });
});

describe('albumMediaAspectClass', () => {
  it('uses 4/5 only for a single feed photo', () => {
    expect(albumMediaAspectClass(1, 'feed')).toBe('aspect-[4/5]');
    expect(albumMediaAspectClass(0, 'feed')).toBe('aspect-[4/5]');
    expect(albumMediaAspectClass(2, 'feed')).toBe('aspect-square');
    expect(albumMediaAspectClass(1, 'square')).toBe('aspect-square');
  });
});

describe('albumOverflowLabel', () => {
  it('shows leftover after four cells', () => {
    expect(albumOverflowLabel(4)).toBeNull();
    expect(albumOverflowLabel(5)).toBe('+1');
    expect(albumOverflowLabel(6)).toBe('+2');
  });
});
