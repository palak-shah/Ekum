import { describe, expect, it } from 'vitest';
import { absoluteMediaUrl, shareLinkOgHtml } from './share-link-og';

describe('shareLinkOgHtml', () => {
  it('puts Ekum, the name, and one photo in the crawler card', () => {
    const html = shareLinkOgHtml({
      view: {
        token: 't1',
        kind: 'collection',
        targetId: 'c1',
        name: 'Wedding silks',
        image: '/media/cover.jpg',
        audience: 'everyone',
        open: true,
        designs: [],
        expired: false,
        path: '/s/t1',
      },
      pageUrl: 'http://localhost:5173/s/t1',
      imageUrl: 'http://localhost:3000/media/cover.jpg',
      fallbackImageUrl: 'http://localhost:5173/brand/app-icon-512.png',
    });
    expect(html).toContain('Ekum · Wedding silks');
    expect(html).toContain('og:image" content="http://localhost:3000/media/cover.jpg"');
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
