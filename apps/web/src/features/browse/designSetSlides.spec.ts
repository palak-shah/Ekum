import { describe, expect, it } from 'vitest';
import {
  designSetFactLines,
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
    });
    expect(slides[2]?.detail).toContain('From Surat Silk House');
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

  it('lists rate, photos, min, tags, and shop when they exist', () => {
    const { meta, detail } = designSetFactLines({
      images: ['a.jpg', 'b.jpg'],
      companyName: 'Surat Silk House',
      rate: 2450,
      unit: 'pc',
      moq: 20,
      categories: ['sarees', 'bridal'],
    });
    expect(meta).toContain('₹2,450');
    expect(meta).toContain('2 photos');
    expect(meta).toContain('Min 20');
    expect(detail).toMatch(/Saree/i);
    expect(detail).toContain('From Surat Silk House');
  });

  it('omits rate when the preview has none', () => {
    const { meta } = designSetFactLines({
      images: ['a.jpg'],
      companyName: 'Loom',
      rate: null,
    });
    expect(meta).toBe('');
    expect(meta).not.toMatch(/request/i);
  });
});
