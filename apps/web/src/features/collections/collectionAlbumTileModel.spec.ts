import { describe, expect, it } from 'vitest';
import { CollectionStatus } from '@ekum/domain-types';
import {
  collectionAlbumMosaicCount,
  collectionAlbumOpenTarget,
} from './collectionAlbumTileModel';

describe('collectionAlbumOpenTarget', () => {
  it('General Collection opens the viewer without manage dock', () => {
    expect(
      collectionAlbumOpenTarget({
        surface: 'library',
        id: 'g1',
        status: CollectionStatus.Published,
        kind: 'general',
      }),
    ).toEqual({ href: '/collections/g1' });
  });

  it('library live opens viewer with packManage', () => {
    expect(
      collectionAlbumOpenTarget({
        surface: 'library',
        id: 'c1',
        status: CollectionStatus.Published,
      }),
    ).toEqual({ href: '/collections/c1', state: { packManage: true } });
  });

  it('library archived opens editor without packManage', () => {
    expect(
      collectionAlbumOpenTarget({
        surface: 'library',
        id: 'c1',
        status: CollectionStatus.Archived,
      }),
    ).toEqual({ href: '/catalog/collections/c1' });
  });

  it('library draft and ready open the editor, not an empty album', () => {
    expect(
      collectionAlbumOpenTarget({
        surface: 'library',
        id: 'c1',
        status: CollectionStatus.Draft,
      }),
    ).toEqual({ href: '/catalog/collections/c1' });
    expect(
      collectionAlbumOpenTarget({
        surface: 'library',
        id: 'c1',
        status: CollectionStatus.Ready,
      }),
    ).toEqual({ href: '/catalog/collections/c1' });
  });

  it('shelf own shop passes packManage; other shop does not', () => {
    expect(
      collectionAlbumOpenTarget({ surface: 'shelf', id: 'c1', packManage: true }),
    ).toEqual({ href: '/collections/c1', state: { packManage: true } });
    expect(collectionAlbumOpenTarget({ surface: 'shelf', id: 'c1' })).toEqual({
      href: '/collections/c1',
    });
  });
});

describe('collectionAlbumMosaicCount', () => {
  it('shelf uses preview count only (no inventory +N)', () => {
    expect(
      collectionAlbumMosaicCount({
        surface: 'shelf',
        productCount: 18,
        previewCount: 4,
      }),
    ).toBe(4);
  });

  it('library can show +N from productCount when four previews', () => {
    expect(
      collectionAlbumMosaicCount({
        surface: 'library',
        productCount: 18,
        previewCount: 4,
      }),
    ).toBe(18);
  });
});
