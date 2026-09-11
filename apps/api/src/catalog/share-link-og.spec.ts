import { describe, expect, it } from 'vitest';
import { absoluteMediaUrl, shareLinkOgHtml } from './share-link-og';

const baseView = {
  token: 't1',
  kind: 'collection' as const,
  targetId: 'c1',
  name: 'Wedding silks',
  companyName: 'Surat Silk House',
  image: '/media/cover.jpg',
  audience: 'everyone',
  open: true,
  designs: [],
  expired: false,
  path: '/s/t1',
};

describe('shareLinkOgHtml', () => {
  it('puts seller, pack name, and collage image in the crawler card', () => {
    const html = shareLinkOgHtml({
      view: baseView,
      pageUrl: 'http://localhost:5173/s/t1',
      imageUrl: 'http://localhost:5173/api/v1/share-links/t1/og-image',
      fallbackImageUrl: 'http://localhost:5173/brand/app-icon-512.png',
    });
    expect(html).toContain('Surat Silk House · Wedding silks');
    expect(html).toContain('Surat Silk House shared a collection on Ekum — open to view.');
    expect(html).toContain(
      'og:image" content="http://localhost:5173/api/v1/share-links/t1/og-image"',
    );
    expect(html).toContain('summary_large_image');
  });
});

describe('absoluteMediaUrl', () => {
  it('prefixes relative media paths', () => {
    expect(absoluteMediaUrl('/cover.jpg', 'http://localhost:3000/media')).toBe(
      'http://localhost:3000/media/cover.jpg',
    );
  });

  it('leaves absolute URLs alone', () => {
    expect(absoluteMediaUrl('https://cdn.example/a.jpg', 'http://localhost:3000/media')).toBe(
      'https://cdn.example/a.jpg',
    );
  });
});
