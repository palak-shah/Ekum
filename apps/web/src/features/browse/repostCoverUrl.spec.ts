import { afterEach, describe, expect, it, vi } from 'vitest';
import { repostCoverUrl } from './repostCoverUrl';

describe('repostCoverUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('omits empty, relative-without-origin, and non-http values', () => {
    expect(repostCoverUrl(null)).toBeUndefined();
    expect(repostCoverUrl('')).toBeUndefined();
    expect(repostCoverUrl('blob:https://x/1')).toBeUndefined();
    expect(repostCoverUrl('data:image/png;base64,abc')).toBeUndefined();
  });

  it('keeps absolute http(s) and rewrites app /media onto the page origin', () => {
    expect(repostCoverUrl('https://cdn.example/pack.jpg')).toBe('https://cdn.example/pack.jpg');
    vi.stubGlobal('window', { location: { origin: 'https://beta.ekum.app' } });
    expect(repostCoverUrl('/media/pack.jpg')).toBe('https://beta.ekum.app/media/pack.jpg');
  });
});
