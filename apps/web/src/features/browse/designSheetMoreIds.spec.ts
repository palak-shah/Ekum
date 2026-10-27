import { describe, expect, it } from 'vitest';
import { designSheetMoreIds } from './designSheetMoreIds';

describe('designSheetMoreIds', () => {
  it('visitor: Bookmark only', () => {
    expect(
      designSheetMoreIds({ canEdit: false, canRemove: false, canDelete: false }),
    ).toEqual(['bookmark']);
  });

  it('own design in collection: Bookmark · Edit · Remove · Delete', () => {
    expect(
      designSheetMoreIds({ canEdit: true, canRemove: true, canDelete: true }),
    ).toEqual(['bookmark', 'edit', 'remove', 'delete']);
  });

  it('own draft: Publish after Edit', () => {
    expect(
      designSheetMoreIds({
        canEdit: true,
        canRemove: true,
        canDelete: true,
        canPublish: true,
      }),
    ).toEqual(['bookmark', 'edit', 'publish', 'remove', 'delete']);
  });

  it('own design in collection can also add to another pack', () => {
    expect(
      designSheetMoreIds({
        canEdit: true,
        canRemove: true,
        canDelete: true,
        canAddToPack: true,
      }),
    ).toEqual(['bookmark', 'edit', 'addToPack', 'remove', 'delete']);
  });

  it('own solo design: Bookmark · Edit · Delete (no Remove)', () => {
    expect(
      designSheetMoreIds({ canEdit: true, canRemove: false, canDelete: true }),
    ).toEqual(['bookmark', 'edit', 'delete']);
  });

  it('You design can add to collection / catalog', () => {
    expect(
      designSheetMoreIds({
        canEdit: true,
        canRemove: false,
        canDelete: true,
        canAddToPack: true,
      }),
    ).toEqual(['bookmark', 'edit', 'addToPack', 'delete']);
  });

  it('curated mill in own pack: Bookmark · Remove', () => {
    expect(
      designSheetMoreIds({ canEdit: false, canRemove: true, canDelete: false }),
    ).toEqual(['bookmark', 'remove']);
  });
});
