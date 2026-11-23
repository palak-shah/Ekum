import { describe, expect, it } from 'vitest';
import {
  mediaUrlForViewer,
  pathAllowedForPreview,
  signMediaUrl,
  verifyMediaUrlToken,
} from './media-url-token';

describe('media-url-token', () => {
  it('signs and verifies a path-bound token', () => {
    const url = signMediaUrl('http://localhost:3000/media/c1/thumbnail1/a.webp', 'preview');
    const parsed = new URL(url);
    expect(
      verifyMediaUrlToken({
        pathname: parsed.pathname,
        kind: parsed.searchParams.get('ekum_k'),
        exp: parsed.searchParams.get('ekum_exp'),
        sig: parsed.searchParams.get('ekum_sig'),
      }),
    ).toBe(true);
  });

  it('rejects a token on a different pathname', () => {
    const url = signMediaUrl('http://localhost:3000/media/c1/thumbnail1/a.webp', 'preview');
    const parsed = new URL(url);
    expect(
      verifyMediaUrlToken({
        pathname: '/media/c2/thumbnail1/a.webp',
        kind: parsed.searchParams.get('ekum_k'),
        exp: parsed.searchParams.get('ekum_exp'),
        sig: parsed.searchParams.get('ekum_sig'),
      }),
    ).toBe(false);
  });

  it('preview tokens cannot open original paths', () => {
    expect(pathAllowedForPreview('/media/c1/original/a.jpg')).toBe(false);
    const url = signMediaUrl('http://localhost:3000/media/c1/original/a.jpg', 'preview');
    const parsed = new URL(url);
    expect(
      verifyMediaUrlToken({
        pathname: parsed.pathname,
        kind: parsed.searchParams.get('ekum_k'),
        exp: parsed.searchParams.get('ekum_exp'),
        sig: parsed.searchParams.get('ekum_sig'),
      }),
    ).toBe(false);
  });

  it('locked viewer rewrite uses thumbnail1 + preview token', () => {
    const out = mediaUrlForViewer('http://localhost:3000/media/c1/original/a.jpg', 'preview');
    expect(out).toContain('/thumbnail1/');
    expect(out).toContain('ekum_k=preview');
  });
});
