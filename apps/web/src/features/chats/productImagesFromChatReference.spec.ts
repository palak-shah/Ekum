import { describe, expect, it } from 'vitest';
import { productImagesFromChatReference } from './productImagesFromChatReference';

describe('productImagesFromChatReference', () => {
  it('rewrites relative media paths so Save to my designs passes Zod url()', () => {
    expect(
      productImagesFromChatReference({
        image: '/media/seed/a.jpg',
        images: null,
      }),
    ).toEqual([`${window.location.origin}/media/seed/a.jpg`]);
  });

  it('rewrites localhost seed thumbs (Soft Lining Roll) onto the page origin', () => {
    expect(
      productImagesFromChatReference({
        image: 'http://127.0.0.1:3000/media/seed/lining.jpg',
        images: null,
      }),
    ).toEqual([`${window.location.origin}/media/seed/lining.jpg`]);
  });

  it('prefers the images list and drops blob previews', () => {
    expect(
      productImagesFromChatReference({
        image: '/media/seed/a.jpg',
        images: ['/media/seed/a.jpg', 'blob:https://x/y', 'https://cdn.example/b.jpg'],
      }),
    ).toEqual([`${window.location.origin}/media/seed/a.jpg`, 'https://cdn.example/b.jpg']);
  });

  it('drops non-http(s) and empty entries after rewrite', () => {
    expect(
      productImagesFromChatReference({
        image: 'ftp://files/x.jpg',
        images: ['blob:https://x/y', ''],
      }),
    ).toEqual([]);
  });
});
