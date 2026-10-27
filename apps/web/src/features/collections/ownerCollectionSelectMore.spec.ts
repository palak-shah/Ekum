import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import {
  ownerAlbumDraftableProductIds,
  ownerAlbumPublishableProductIds,
  ownerCollectionSelectMoreIds,
  stampOwnerAddToPackDesigns,
} from './ownerCollectionSelectMore';

describe('ownerCollectionSelectMoreIds', () => {
  it('Bookmark · Draft · Publish · Add · Remove · Delete last; GC keeps Add', () => {
    expect(ownerCollectionSelectMoreIds()).toEqual([
      'bookmark',
      'draft',
      'publish',
      'addToPack',
      'remove',
      'delete',
    ]);
    expect(ownerCollectionSelectMoreIds(true)).toEqual([
      'bookmark',
      'draft',
      'publish',
      'addToPack',
    ]);
    expect(ownerCollectionSelectMoreIds(false, true)).toEqual([
      'bookmark',
      'draft',
      'publish',
      'remove',
      'delete',
    ]);
  });
});

describe('ownerAlbumDraftableProductIds', () => {
  it('keeps published own picks and skips drafts and mill rows', () => {
    expect(
      ownerAlbumDraftableProductIds(
        [
          { id: 'mine', status: ProductStatus.Published, companyId: 'me' },
          { id: 'draft', status: ProductStatus.Draft, companyId: 'me' },
          { id: 'mill', status: ProductStatus.Published, companyId: 'mill' },
        ],
        ['mine', 'draft', 'mill'],
        'me',
      ),
    ).toEqual(['mine']);
  });
});

describe('ownerAlbumPublishableProductIds', () => {
  it('keeps draft own picks and skips live and mill rows', () => {
    expect(
      ownerAlbumPublishableProductIds(
        [
          { id: 'mine', status: ProductStatus.Draft, companyId: 'me' },
          { id: 'live', status: ProductStatus.Published, companyId: 'me' },
          { id: 'mill', status: ProductStatus.Draft, companyId: 'mill' },
        ],
        ['mine', 'live', 'mill'],
        'me',
      ),
    ).toEqual(['mine']);
  });
});

describe('stampOwnerAddToPackDesigns', () => {
  it('stamps this pack on regular albums only', () => {
    expect(
      stampOwnerAddToPackDesigns([{ collectionIds: ['other'] }], 'col', false),
    ).toEqual([{ collectionIds: ['other', 'col'] }]);
    expect(stampOwnerAddToPackDesigns([{ collectionIds: [] }], 'gc', true)).toEqual([
      { collectionIds: [] },
    ]);
  });
});
