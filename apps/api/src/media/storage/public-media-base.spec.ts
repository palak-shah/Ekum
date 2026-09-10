import { describe, expect, it } from 'vitest';
import { assertPublicMediaBaseUrl } from './public-media-base';

describe('assertPublicMediaBaseUrl', () => {
  it('accepts absolute http(s) bases and strips a trailing slash', () => {
    expect(assertPublicMediaBaseUrl('https://beta.ekum.app/media/')).toBe(
      'https://beta.ekum.app/media',
    );
    expect(assertPublicMediaBaseUrl('http://localhost:8080/media')).toBe(
      'http://localhost:8080/media',
    );
  });

  it('rejects relative or empty bases so Photo Order never gets Invalid url', () => {
    expect(() => assertPublicMediaBaseUrl('/media')).toThrow(/PUBLIC_MEDIA_BASE_URL/);
    expect(() => assertPublicMediaBaseUrl('')).toThrow(/PUBLIC_MEDIA_BASE_URL/);
    expect(() => assertPublicMediaBaseUrl('media')).toThrow(/PUBLIC_MEDIA_BASE_URL/);
  });
});
