import { describe, expect, it } from 'vitest';
import { libraryCollectionThumb } from './library-collection-thumb';

describe('libraryCollectionThumb', () => {
  it('uses the last photo on the newest design, including drafts', () => {
    expect(
      libraryCollectionThumb([
        {
          images: ['old-a.jpg', 'old-b.jpg'],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          images: ['new-a.jpg', 'new-b.jpg'],
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
      ]),
    ).toBe('new-b.jpg');
  });

  it('skips members with no photo', () => {
    expect(
      libraryCollectionThumb([
        { images: [], updatedAt: '2026-08-01T00:00:00.000Z' },
        { images: ['only.jpg'], updatedAt: '2026-01-01T00:00:00.000Z' },
      ]),
    ).toBe('only.jpg');
  });

  it('returns null when nothing has a photo', () => {
    expect(libraryCollectionThumb([{ images: ['  '] }])).toBeNull();
  });
});
