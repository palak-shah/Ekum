import { describe, expect, it } from 'vitest';
import type { CollectionCard, ExploreProductCard } from '@ekum/domain-types';
import {
  companyOpenedFromChat,
  shopCollectionPhoto,
  shopCollectionPreviewImages,
  shopDesignPhoto,
} from './shopPhoto';

const company = {
  id: 'c1',
  name: 'Surat Silk House',
  city: 'Surat',
  verification: 'none' as const,
  logoUrl: null,
};

describe('shopPhoto', () => {
  it('detects a 1:1 title open', () => {
    expect(companyOpenedFromChat({ fromChat: true })).toBe(true);
    expect(companyOpenedFromChat({})).toBe(false);
    expect(companyOpenedFromChat(null)).toBe(false);
  });

  it('uses preview design photos, not coverImage', () => {
    const collection = {
      id: 'a',
      name: 'Wedding Edit',
      categories: [],
      memberFind: [],
      coverImage: 'https://cdn/cover.jpg',
      previewImages: ['https://cdn/d1.jpg', 'https://cdn/d2.jpg'],
      imageCount: 2,
      productCount: 2,
      status: 'published',
      updatedAt: '2026-01-01T00:00:00.000Z',
      allowForward: true,
      orderPathPreference: null,
      company,
    } satisfies CollectionCard;
    expect(shopCollectionPhoto(collection)).toBe('https://cdn/d1.jpg');
    expect(shopCollectionPhoto({ ...collection, previewImages: [] })).toBeNull();
    expect(shopCollectionPreviewImages(collection)).toEqual([
      'https://cdn/d1.jpg',
      'https://cdn/d2.jpg',
    ]);
  });

  it('uses the first design image', () => {
    const product = {
      id: 'p1',
      name: 'Red silk',
      images: ['https://cdn/p.jpg'],
      rate: null,
      company,
    } as ExploreProductCard;
    expect(shopDesignPhoto(product)).toBe('https://cdn/p.jpg');
  });
});
