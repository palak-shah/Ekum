import { describe, expect, it } from 'vitest';
import {
  catalogShareCanLink,
  catalogShareCopiedToast,
  catalogShareInviteText,
  catalogShareLinkBodies,
} from './catalogShareLinkUnits';

describe('catalogShareLinkBodies', () => {
  it('mints a collection door then a design door for a mix', () => {
    expect(
      catalogShareLinkBodies({
        collectionIds: ['col1'],
        productIds: ['p1'],
      }),
    ).toEqual([{ collectionId: 'col1' }, { productId: 'p1' }]);
  });

  it('clubs leftover designs into one designs door', () => {
    expect(
      catalogShareLinkBodies({
        collectionIds: ['col1'],
        productIds: ['p1', 'p2'],
      }),
    ).toEqual([{ collectionId: 'col1' }, { productIds: ['p1', 'p2'] }]);
  });

  it('mints one door per album when there are no leftover designs', () => {
    expect(
      catalogShareLinkBodies({
        collectionIds: ['a', 'b'],
        productIds: [],
      }),
    ).toEqual([{ collectionId: 'a' }, { collectionId: 'b' }]);
  });
});

describe('catalogShareCanLink', () => {
  it('is true for a mix', () => {
    expect(catalogShareCanLink({ collectionIds: ['col1'], productIds: ['p1'] })).toBe(true);
  });

  it('is false when there is nothing to mint', () => {
    expect(catalogShareCanLink({ collectionIds: [], productIds: [] })).toBe(false);
  });
});

describe('catalogShareCopiedToast', () => {
  it('names N when more than one door was copied', () => {
    expect(catalogShareCopiedToast(1)).toBe('Link copied · 48 hours');
    expect(catalogShareCopiedToast(2)).toBe('2 links copied · 48 hours');
  });
});

describe('catalogShareInviteText', () => {
  it('puts every url in the body', () => {
    expect(
      catalogShareInviteText(['Surat Silk House shared Monsoon on Ekum'], [
        'https://ekum.app/s/a',
        'https://ekum.app/s/b',
      ]),
    ).toBe('Surat Silk House shared Monsoon on Ekum\nhttps://ekum.app/s/a\nhttps://ekum.app/s/b');
  });
});
