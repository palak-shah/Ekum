import { describe, expect, it } from 'vitest';
import { signUnsignedMediaUrls } from './sign-media-urls.interceptor';

describe('signUnsignedMediaUrls', () => {
  it('signs local /media URLs in nested JSON', () => {
    const out = signUnsignedMediaUrls({
      images: ['http://localhost:3000/media/c1/original/a.jpg'],
      nested: { cover: '/media/c1/thumbnail1/b.webp' },
    }) as {
      images: string[];
      nested: { cover: string };
    };
    expect(out.images[0]).toContain('ekum_sig=');
    expect(out.images[0]).toContain('ekum_k=full');
    expect(out.nested.cover).toContain('ekum_sig=');
  });

  it('leaves already-signed URLs alone', () => {
    const signed =
      'http://localhost:3000/media/c1/thumbnail1/a.webp?ekum_k=preview&ekum_exp=9999999999&ekum_sig=abc';
    const out = signUnsignedMediaUrls({ url: signed }) as { url: string };
    expect(out.url).toBe(signed);
  });

  it('leaves non-media URLs alone', () => {
    const out = signUnsignedMediaUrls({
      logo: 'https://cdn.example/logo.png',
    }) as { logo: string };
    expect(out.logo).toBe('https://cdn.example/logo.png');
  });
});
