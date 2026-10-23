import { describe, expect, it } from 'vitest';
import {
  MEDIA_VARIANT,
  mediaVariantBlobPath,
  mediaVariantUrl,
  originalBlobCandidates,
  parseManagedMediaUrl,
  relocateOriginalBlobPath,
  relocateOriginalUrl,
} from '@ekum/domain-types';

describe('mediaVariantBlobPath', () => {
  it('maps a new original key to WebP siblings', () => {
    expect(mediaVariantBlobPath('c1/original/abc.jpg', MEDIA_VARIANT.Thumbnail1)).toBe(
      'c1/thumbnail1/abc.webp',
    );
    expect(mediaVariantBlobPath('c1/original/abc.jpg', MEDIA_VARIANT.Thumbnail2)).toBe(
      'c1/thumbnail2/abc.webp',
    );
    expect(mediaVariantBlobPath('c1/original/abc.jpg', MEDIA_VARIANT.Original)).toBe(
      'c1/original/abc.jpg',
    );
  });

  it('maps a legacy flat key to the same folders', () => {
    expect(mediaVariantBlobPath('c1/abc.jpg', MEDIA_VARIANT.Thumbnail1)).toBe(
      'c1/thumbnail1/abc.webp',
    );
    expect(mediaVariantBlobPath('c1/abc.jpg', MEDIA_VARIANT.Original)).toBe('c1/original/abc.jpg');
  });

  it('maps seed catalog jpgs to sibling WebP thumbs (original stays at seed/{name}.jpg)', () => {
    expect(mediaVariantBlobPath('seed/kanjee.jpg', MEDIA_VARIANT.Thumbnail1)).toBe(
      'seed/thumbnail1/kanjee.webp',
    );
    expect(mediaVariantBlobPath('seed/kanjee.jpg', MEDIA_VARIANT.Thumbnail2)).toBe(
      'seed/thumbnail2/kanjee.webp',
    );
    expect(mediaVariantBlobPath('seed/kanjee.jpg', MEDIA_VARIANT.Original)).toBe('seed/kanjee.jpg');
  });

  it('returns null for audio and unknown keys', () => {
    expect(mediaVariantBlobPath('c1/clip.webm', MEDIA_VARIANT.Thumbnail1)).toBeNull();
    expect(mediaVariantBlobPath('../x.jpg', MEDIA_VARIANT.Thumbnail1)).toBeNull();
  });
});

describe('relocateOriginalBlobPath', () => {
  it('inserts original/ on a legacy image key', () => {
    expect(relocateOriginalBlobPath('c1/x.jpg')).toBe('c1/original/x.jpg');
  });

  it('is a no-op for keys already in original/', () => {
    expect(relocateOriginalBlobPath('c1/original/x.jpg')).toBe('c1/original/x.jpg');
  });

  it('skips audio, pdf, seed, and thumbnail keys', () => {
    expect(relocateOriginalBlobPath('c1/a.webm')).toBeNull();
    expect(relocateOriginalBlobPath('c1/a.pdf')).toBeNull();
    expect(relocateOriginalBlobPath('seed/x.jpg')).toBeNull();
    expect(relocateOriginalBlobPath('c1/thumbnail1/x.webp')).toBeNull();
  });
});

describe('originalBlobCandidates', () => {
  it('tries original then legacy for a new key', () => {
    expect(originalBlobCandidates('c1/original/a.jpg')).toEqual([
      'c1/original/a.jpg',
      'c1/a.jpg',
    ]);
  });

  it('tries legacy then original for a flat key', () => {
    expect(originalBlobCandidates('c1/a.jpg')).toEqual(['c1/a.jpg', 'c1/original/a.jpg']);
  });
});

describe('mediaVariantUrl', () => {
  it('rewrites a local absolute original URL', () => {
    expect(
      mediaVariantUrl('http://localhost:8080/media/c1/original/a.jpg', MEDIA_VARIANT.Thumbnail1),
    ).toBe('http://localhost:8080/media/c1/thumbnail1/a.webp');
  });

  it('rewrites a relative /media URL', () => {
    expect(mediaVariantUrl('/media/c1/a.jpg', MEDIA_VARIANT.Thumbnail2)).toBe(
      '/media/c1/thumbnail2/a.webp',
    );
  });

  it('rewrites an Azure blob URL', () => {
    expect(
      mediaVariantUrl(
        'https://ekumdev.blob.core.windows.net/media/c1/abc.png',
        MEDIA_VARIANT.Thumbnail1,
      ),
    ).toBe('https://ekumdev.blob.core.windows.net/media/c1/thumbnail1/abc.webp');
  });

  it('rewrites seed catalog URLs to sibling thumbs', () => {
    expect(
      mediaVariantUrl('http://localhost:8080/media/seed/kanjee.jpg', MEDIA_VARIANT.Thumbnail1),
    ).toBe('http://localhost:8080/media/seed/thumbnail1/kanjee.webp');
    expect(mediaVariantUrl('/media/seed/kanjee.jpg', MEDIA_VARIANT.Thumbnail2)).toBe(
      '/media/seed/thumbnail2/kanjee.webp',
    );
  });

  it('leaves blob, data, and external URLs unchanged', () => {
    expect(mediaVariantUrl('blob:https://x/y', MEDIA_VARIANT.Thumbnail1)).toBe('blob:https://x/y');
    expect(mediaVariantUrl('data:image/png;base64,aa', MEDIA_VARIANT.Thumbnail1)).toBe(
      'data:image/png;base64,aa',
    );
    expect(mediaVariantUrl('https://cdn.example/a.jpg', MEDIA_VARIANT.Thumbnail1)).toBe(
      'https://cdn.example/a.jpg',
    );
  });
});

describe('relocateOriginalUrl', () => {
  it('inserts /original/ on a managed image URL', () => {
    expect(relocateOriginalUrl('http://localhost:8080/media/c1/a.jpg')).toBe(
      'http://localhost:8080/media/c1/original/a.jpg',
    );
  });

  it('does not rewrite a URL already under original/', () => {
    expect(relocateOriginalUrl('http://localhost:8080/media/c1/original/a.jpg')).toBe(
      'http://localhost:8080/media/c1/original/a.jpg',
    );
  });
});

describe('parseManagedMediaUrl', () => {
  it('parses Azure container + blob path', () => {
    expect(
      parseManagedMediaUrl('https://acct.blob.core.windows.net/media/c1/original/a.jpg'),
    ).toEqual({
      origin: 'https://acct.blob.core.windows.net',
      prefix: '/media',
      blobPath: 'c1/original/a.jpg',
    });
  });
});
