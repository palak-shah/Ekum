import { CollectionStatus } from '@ekum/domain-types';
import { describe, expect, it } from 'vitest';
import { youCollectionRowMore } from './youLibraryRowMore';

describe('youCollectionRowMore', () => {
  it('published: Hide Draft, Delete, Order', () => {
    expect(youCollectionRowMore({ status: CollectionStatus.Published })).toEqual([
      'hide',
      'archive',
      'order',
    ]);
  });

  it('draft: Publish (action id unhide), Archive, Order', () => {
    expect(youCollectionRowMore({ status: CollectionStatus.Draft })).toEqual([
      'unhide',
      'archive',
      'order',
    ]);
  });

  it('deleted: Order only — no Restore', () => {
    expect(youCollectionRowMore({ status: CollectionStatus.Archived })).toEqual(['order']);
  });

  it('General Collection has no row more', () => {
    expect(youCollectionRowMore({ status: CollectionStatus.Published, kind: 'general' })).toEqual(
      [],
    );
  });
});
