import { describe, expect, it, vi } from 'vitest';
import { tradeListGallery, tradeListGalleryIndex } from './tradeListGallery';
import type { TradeListItem } from './tradeList';

vi.mock('@/lib/mediaUrl', () => ({
  toAbsoluteMediaUrl: (url: string) => (url.startsWith('http') ? url : `https://cdn.test/${url}`),
}));

function orderItem(images: Array<{ name: string; image?: string | null; images?: string[] }>): TradeListItem {
  return {
    kind: 'order',
    id: 'o1',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    direction: 'selling',
    order: {
      id: 'o1',
      items: images.map((row, index) => ({
        id: `i${index}`,
        productId: null,
        name: row.name,
        sku: null,
        rate: 10,
        unit: 'pc',
        image: row.image ?? null,
        images: row.images ?? [],
        quantity: 10,
        requestedQuantity: 10,
        lineStatus: 'open',
        shippedQuantity: 0,
        remainingQuantity: 10,
        note: null,
      })),
      counterpart: { id: 'c1', name: 'Shop', city: null, verification: 'none', logoUrl: null },
    },
  } as TradeListItem;
}

describe('tradeListGallery', () => {
  it('builds absolute gallery with captions for order lines', () => {
    const gallery = tradeListGallery(
      orderItem([
        { name: 'Silk', images: ['a.jpg', 'a2.jpg'] },
        { name: 'Cotton', image: 'b.jpg' },
      ]),
    );
    expect(gallery.urls).toEqual([
      'https://cdn.test/a.jpg',
      'https://cdn.test/a2.jpg',
      'https://cdn.test/b.jpg',
    ]);
    expect(gallery.captions).toEqual(['Silk', 'Silk', 'Cotton']);
  });

  it('maps stack thumb URL to gallery index', () => {
    const urls = ['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg'];
    expect(tradeListGalleryIndex(urls, 'b.jpg')).toBe(1);
    expect(tradeListGalleryIndex(urls, 'missing.jpg')).toBe(0);
  });

  it('uses complaint images', () => {
    const gallery = tradeListGallery({
      kind: 'complaint',
      id: 'c1',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      direction: 'buying',
      complaint: {
        id: 'c1',
        subject: 'Wrong pack',
        images: ['x.jpg'],
        status: 'open',
        mine: false,
        counterpartName: 'Shop',
      },
    } as TradeListItem);
    expect(gallery.urls).toEqual(['https://cdn.test/x.jpg']);
    expect(gallery.captions).toEqual(['Wrong pack']);
  });
});
