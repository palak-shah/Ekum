import { describe, expect, it } from 'vitest';
import { coverMissingFromMembers } from './collectionCover';

describe('coverMissingFromMembers', () => {
  it('is false when there is no cover', () => {
    expect(coverMissingFromMembers(null, [{ images: ['https://img/a'] }])).toBe(false);
  });

  it('is false when a member design already has the cover photo', () => {
    expect(
      coverMissingFromMembers('https://img/cover', [
        { images: ['https://img/cover', 'https://img/b'] },
      ]),
    ).toBe(false);
  });

  it('is true when cover is not among member photos (orphan first mosaic cell)', () => {
    expect(
      coverMissingFromMembers('https://img/cover', [
        { images: ['https://img/a'] },
        { images: ['https://img/b'] },
      ]),
    ).toBe(true);
  });

  it('is true when the album has no member list yet', () => {
    expect(coverMissingFromMembers('https://img/cover', null)).toBe(true);
    expect(coverMissingFromMembers('https://img/cover', [])).toBe(true);
  });
});
