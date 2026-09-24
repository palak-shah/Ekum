import { describe, expect, it } from 'vitest';
import {
  designSetSlides,
  designShopLine,
  firstSlideIndexForProduct,
} from './designSetSlides';

describe('designSetSlides', () => {
  it('flattens two shops so the next photo is the next design', () => {
    const slides = designSetSlides([
      {
        id: 'a',
        name: 'Georgette Base',
        images: ['a1.jpg', 'a2.jpg'],
        companyName: 'Ahmedabad Loom Co',
      },
      {
        id: 'b',
        name: 'Soft Lining',
        images: ['b1.jpg'],
        companyName: 'Surat Silk House',
      },
    ]);
    expect(slides.map((s) => s.productId)).toEqual(['a', 'a', 'b']);
    expect(slides[2]).toMatchObject({
      caption: 'Soft Lining',
      detail: 'From Surat Silk House',
    });
    expect(firstSlideIndexForProduct(slides, 'b')).toBe(2);
  });

  it('skips designs with no photos', () => {
    expect(
      designSetSlides([
        { id: 'a', name: 'Empty', images: [], companyName: 'Loom' },
        { id: 'b', name: 'Has shot', images: ['b.jpg'], companyName: 'Loom' },
      ]),
    ).toHaveLength(1);
  });

  it('names the shop so mixed designs are not one pack', () => {
    expect(designShopLine('Jaipur Emporium')).toBe('From Jaipur Emporium');
    expect(designShopLine('  ')).toBe('');
  });
});
