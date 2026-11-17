import { describe, expect, it } from 'vitest';
import {
  appendShowcaseUrls,
  moveShowcaseUrl,
  removeShowcaseUrl,
  showcaseGalleryIndex,
  showcaseOnlyUrls,
  showcaseSlotsLeft,
} from './showcaseUrls';

describe('showcaseUrls helpers', () => {
  it('appends with dedupe and max', () => {
    expect(appendShowcaseUrls(['a'], ['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });

  it('removes one url', () => {
    expect(removeShowcaseUrl(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('moves left and right', () => {
    expect(moveShowcaseUrl(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveShowcaseUrl(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
  });

  it('accounts for cover in gallery index', () => {
    expect(showcaseGalleryIndex('https://c.jpg', 0)).toBe(1);
    expect(showcaseGalleryIndex(null, 0)).toBe(0);
    expect(showcaseGalleryIndex('https://c.jpg', 2)).toBe(3);
  });

  it('slots left', () => {
    expect(showcaseSlotsLeft(8)).toBe(2);
    expect(showcaseSlotsLeft(10)).toBe(0);
  });

  it('showcaseOnlyUrls keeps saved order without cover', () => {
    expect(showcaseOnlyUrls(['a', '', 'b'])).toEqual(['a', 'b']);
    expect(showcaseOnlyUrls(null)).toEqual([]);
  });
});
