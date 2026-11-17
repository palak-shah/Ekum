import { describe, expect, it } from 'vitest';
import { profileGalleryUrls } from './profileGalleryUrls';

describe('profileGalleryUrls', () => {
  it('puts cover first and preserves showcase order', () => {
    expect(profileGalleryUrls('https://c.jpg', ['https://a.jpg', 'https://b.jpg'])).toEqual([
      'https://c.jpg',
      'https://a.jpg',
      'https://b.jpg',
    ]);
  });

  it('skips showcase URLs that duplicate the cover', () => {
    expect(
      profileGalleryUrls('https://c.jpg', ['https://c.jpg', 'https://a.jpg', 'https://c.jpg']),
    ).toEqual(['https://c.jpg', 'https://a.jpg']);
  });

  it('returns showcase only when there is no cover', () => {
    expect(profileGalleryUrls(null, ['https://a.jpg'])).toEqual(['https://a.jpg']);
  });

  it('returns empty when both missing', () => {
    expect(profileGalleryUrls(null, [])).toEqual([]);
  });
});
