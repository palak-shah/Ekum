import { describe, expect, it } from 'vitest';
import {
  partitionRelistableDesigns,
  partitionRelistableAlbums,
  curateLockedSkipMessage,
  curateDefaultPackName,
  packLockReason,
} from './curateAlbumResolve';
import { curateResolveSummary } from './albumSelectModel';
import type { BrowseShortlistEntry } from './browseShortlist';
import type { BrowseAlbumEntry } from './browseAlbumPick';

function entry(
  productId: string,
  name: string,
  allowForward?: boolean,
): BrowseShortlistEntry {
  return {
    productId,
    name,
    thumbUrl: null,
    companyId: 'c1',
    companyName: 'Shop',
    allowForward,
  };
}

function album(
  collectionId: string,
  name: string,
  allowForward?: boolean,
): BrowseAlbumEntry {
  return {
    collectionId,
    name,
    coverImage: null,
    companyId: 'c1',
    companyName: 'Shop',
    allowForward,
  };
}

describe('partitionRelistableDesigns', () => {
  it('treats undefined allowForward as allowed; false as locked', () => {
    const { allowed, locked } = partitionRelistableDesigns([
      entry('a', 'A'),
      entry('b', 'B', true),
      entry('c', 'C', false),
    ]);
    expect(allowed.map((e) => e.productId)).toEqual(['a', 'b']);
    expect(locked.map((e) => e.productId)).toEqual(['c']);
  });
});

describe('partitionRelistableAlbums', () => {
  it('excludes pack-locked albums from Curate resolve', () => {
    const { allowed, locked } = partitionRelistableAlbums([
      album('w', 'Wedding'),
      album('k', "Kavita's Saree collection", false),
    ]);
    expect(allowed.map((e) => e.collectionId)).toEqual(['w']);
    expect(locked.map((e) => e.collectionId)).toEqual(['k']);
  });
});

describe('curateLockedSkipMessage', () => {
  it('counts skipped locked lines', () => {
    expect(curateLockedSkipMessage(1)).toBe('1 locked — seller doesn’t allow pack');
    expect(curateLockedSkipMessage(3)).toBe('3 locked — seller doesn’t allow pack');
  });
});

describe('curateDefaultPackName', () => {
  it('prefills from one expanded album', () => {
    expect(
      curateDefaultPackName({
        expandedAlbumNames: ['Wedding Edit'],
        allowedDesignNames: ['A', 'B'],
      }),
    ).toBe('Wedding Edit');
  });

  it('prefills single design when no album expand', () => {
    expect(
      curateDefaultPackName({
        expandedAlbumNames: [],
        allowedDesignNames: ['Silk border'],
      }),
    ).toBe('Silk border');
  });

  it('leaves empty for multiple albums or multiple designs without single album', () => {
    expect(
      curateDefaultPackName({
        expandedAlbumNames: ['A', 'B'],
        allowedDesignNames: ['x'],
      }),
    ).toBe('');
    expect(
      curateDefaultPackName({
        expandedAlbumNames: [],
        allowedDesignNames: ['x', 'y'],
      }),
    ).toBe('');
  });
});

describe('curateResolveSummary', () => {
  it('mirrors order summary shape', () => {
    expect(curateResolveSummary(0, 2)).toBe('You selected 2 collections.');
    expect(curateResolveSummary(1, 1)).toBe('You selected 1 design + 1 collection.');
  });
});

describe('packLockReason', () => {
  it('returns reason only when allowForward is false', () => {
    expect(packLockReason(false)).toBe("Can't put in a pack");
    expect(packLockReason(true)).toBeUndefined();
    expect(packLockReason(undefined)).toBeUndefined();
  });
});
