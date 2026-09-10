import { describe, expect, it } from 'vitest';
import {
  assertPublicMediaBaseUrl,
  resolvePublicMediaBaseUrl,
} from './public-media-base';

describe('resolvePublicMediaBaseUrl', () => {
  it('accepts absolute http(s) bases and strips a trailing slash', () => {
    expect(resolvePublicMediaBaseUrl('https://beta.ekum.app/media/')).toBe(
      'https://beta.ekum.app/media',
    );
    expect(assertPublicMediaBaseUrl('http://localhost:8080/media')).toBe(
      'http://localhost:8080/media',
    );
  });

  it('resolves relative /media against an origin hint so API can boot', () => {
    expect(
      resolvePublicMediaBaseUrl('/media', {
        originHint: 'https://beta.ekum.app,http://localhost:8080',
      }),
    ).toBe('https://beta.ekum.app/media');
  });

  it('falls back to localhost docker media when relative and no origin hint', () => {
    expect(resolvePublicMediaBaseUrl('/media')).toBe('http://localhost:8080/media');
    expect(resolvePublicMediaBaseUrl('')).toBe('http://localhost:8080/media');
    expect(resolvePublicMediaBaseUrl('media')).toBe('http://localhost:8080/media');
  });
});
