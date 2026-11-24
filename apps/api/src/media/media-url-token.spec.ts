import { describe, expect, it } from 'vitest';
import {
  mapMediaUrlsForViewer,
  mediaUrlForViewer,
  stripMediaAccessParams,
} from './media-url-token';

describe('media-url-token (plain URLs)', () => {
  it('passes stored URLs through unchanged', () => {
    const original = 'http://localhost:3000/media/c1/original/a.jpg';
    expect(mediaUrlForViewer(original, 'preview')).toBe(original);
    expect(mediaUrlForViewer(original, 'full')).toBe(original);
  });

  it('mapMediaUrlsForViewer does not add tokens or rewrite variants', () => {
    const urls = [
      'http://localhost:3000/media/c1/original/a.jpg',
      '/media/c1/thumbnail2/b.webp',
    ];
    expect(mapMediaUrlsForViewer(urls, 'preview')).toEqual(urls);
    expect(mapMediaUrlsForViewer(urls, 'full')).toEqual(urls);
  });

  it('trims whitespace', () => {
    expect(mediaUrlForViewer('  /media/c1/original/a.jpg  ', 'full')).toBe(
      '/media/c1/original/a.jpg',
    );
  });

  it('strips legacy ekum_* tokens from absolute and relative URLs', () => {
    expect(
      mediaUrlForViewer(
        'http://localhost:3000/media/c1/original/a.jpg?ekum_k=full&ekum_exp=999&ekum_sig=abc',
        'full',
      ),
    ).toBe('http://localhost:3000/media/c1/original/a.jpg');
    expect(
      mapMediaUrlsForViewer(
        ['/media/c1/original/a.jpg?ekum_k=preview&ekum_exp=1&ekum_sig=x'],
        'preview',
      ),
    ).toEqual(['/media/c1/original/a.jpg']);
  });

  it('stripMediaAccessParams leaves non-ekum query keys', () => {
    expect(
      stripMediaAccessParams('/media/c1/a.jpg?ekum_sig=x&cache=1'),
    ).toBe('/media/c1/a.jpg?cache=1');
  });
});
