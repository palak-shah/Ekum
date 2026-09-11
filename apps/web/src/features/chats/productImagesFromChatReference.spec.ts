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

  it('prefers the images list and drops blob previews', () => {
    expect(
      productImagesFromChatReference({
        image: '/media/seed/a.jpg',
        images: ['/media/seed/a.jpg', 'blob:https://x/y', 'https://cdn.example/b.jpg'],
      }),
    ).toEqual([`${window.location.origin}/media/seed/a.jpg`, 'https://cdn.example/b.jpg']);
  });
});
