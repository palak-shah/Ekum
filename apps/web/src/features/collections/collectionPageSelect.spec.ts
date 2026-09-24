import { describe, expect, it } from 'vitest';
import { collectionPageIsSelecting } from './collectionPageSelect';

describe('collectionPageIsSelecting', () => {
  it('is off when the traveling pile is on but this album is not', () => {
    expect(collectionPageIsSelecting({ enterSelect: false, pageSelecting: false })).toBe(false);
  });

  it('is on after Choose designs or a long-press on this album', () => {
    expect(collectionPageIsSelecting({ enterSelect: true, pageSelecting: false })).toBe(true);
    expect(collectionPageIsSelecting({ enterSelect: false, pageSelecting: true })).toBe(true);
  });
});
