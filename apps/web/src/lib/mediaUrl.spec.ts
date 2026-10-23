import { describe, expect, it } from 'vitest';
import { MEDIA_VARIANT, mediaDisplayUrl, toAbsoluteMediaUrl } from './mediaUrl';

describe('toAbsoluteMediaUrl', () => {
  it('returns empty when the url is missing (group photo optional)', () => {
    expect(toAbsoluteMediaUrl(null)).toBe('');
    expect(toAbsoluteMediaUrl(undefined)).toBe('');
    expect(toAbsoluteMediaUrl('')).toBe('');
  });

  it('turns relative /media paths into absolute page URLs', () => {
    expect(toAbsoluteMediaUrl('/media/c1/a.jpg', 'https://beta.ekum.app')).toBe(
      'https://beta.ekum.app/media/c1/a.jpg',
    );
  });

  it('rewrites localhost media hosts to the page origin', () => {
    expect(
      toAbsoluteMediaUrl('http://localhost:8080/media/c1/a.jpg', 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/c1/a.jpg');
  });

  it('rewrites LAN http media on an https page (mixed content)', () => {
    expect(
      toAbsoluteMediaUrl(
        'http://74.225.252.243:8081/media/seed-company-ravi/x.jpg',
        'https://beta.ekum.app',
      ),
    ).toBe('https://beta.ekum.app/media/seed-company-ravi/x.jpg');
  });

  it('leaves already-correct absolute URLs alone', () => {
    expect(
      toAbsoluteMediaUrl('https://beta.ekum.app/media/c1/a.jpg', 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/c1/a.jpg');
  });

  it('leaves Azure blob URLs alone', () => {
    const azure =
      'https://acct.blob.core.windows.net/media/c1/a.jpg';
    expect(toAbsoluteMediaUrl(azure, 'https://beta.ekum.app')).toBe(azure);
  });

  it('leaves blob: and data: voice previews alone', () => {
    expect(toAbsoluteMediaUrl('blob:https://beta.ekum.app/abc', 'https://beta.ekum.app')).toBe(
      'blob:https://beta.ekum.app/abc',
    );
    expect(toAbsoluteMediaUrl('data:audio/webm;base64,AAA', 'https://beta.ekum.app')).toBe(
      'data:audio/webm;base64,AAA',
    );
  });
});

describe('mediaDisplayUrl', () => {
  it('maps a managed original to thumbnail1 / thumbnail2 WebP', () => {
    expect(mediaDisplayUrl('/media/c1/a.jpg', MEDIA_VARIANT.Thumbnail1, 'https://beta.ekum.app')).toBe(
      'https://beta.ekum.app/media/c1/thumbnail1/a.webp',
    );
    expect(
      mediaDisplayUrl(
        'http://localhost:8080/media/c1/original/a.jpg',
        MEDIA_VARIANT.Thumbnail2,
        'https://beta.ekum.app',
      ),
    ).toBe('https://beta.ekum.app/media/c1/thumbnail2/a.webp');
  });

  it('picks thumbnail1 for list/cards, thumbnail2 for feed, original for PhotoViewer', () => {
    const stored = '/media/c1/original/saree.jpg';
    const origin = 'https://beta.ekum.app';
    expect(mediaDisplayUrl(stored, MEDIA_VARIANT.Thumbnail1, origin)).toBe(
      'https://beta.ekum.app/media/c1/thumbnail1/saree.webp',
    );
    expect(mediaDisplayUrl(stored, MEDIA_VARIANT.Thumbnail2, origin)).toBe(
      'https://beta.ekum.app/media/c1/thumbnail2/saree.webp',
    );
    expect(mediaDisplayUrl(stored, MEDIA_VARIANT.Original, origin)).toBe(
      'https://beta.ekum.app/media/c1/original/saree.jpg',
    );
  });

  it('maps seed catalog originals to sibling thumbs; PhotoViewer keeps original', () => {
    expect(
      mediaDisplayUrl('/media/seed/kanjee.jpg', MEDIA_VARIANT.Thumbnail1, 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/seed/thumbnail1/kanjee.webp');
    expect(
      mediaDisplayUrl('/media/seed/kanjee.jpg', MEDIA_VARIANT.Thumbnail2, 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/seed/thumbnail2/kanjee.webp');
    expect(
      mediaDisplayUrl('/media/seed/kanjee.jpg', MEDIA_VARIANT.Original, 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/seed/kanjee.jpg');
  });

  it('keeps original, blob, and unrelated hosts', () => {
    expect(
      mediaDisplayUrl('/media/c1/a.jpg', MEDIA_VARIANT.Original, 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/c1/a.jpg');
    expect(
      mediaDisplayUrl('blob:https://beta.ekum.app/abc', MEDIA_VARIANT.Thumbnail1, 'https://beta.ekum.app'),
    ).toBe('blob:https://beta.ekum.app/abc');
    expect(
      mediaDisplayUrl('https://cdn.example/logo.jpg', MEDIA_VARIANT.Thumbnail1, 'https://beta.ekum.app'),
    ).toBe('https://cdn.example/logo.jpg');
  });
});
