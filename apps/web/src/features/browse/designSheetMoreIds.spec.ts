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

  it('own solo design: Bookmark · Edit · Delete (no Remove)', () => {
    expect(
      designSheetMoreIds({ canEdit: true, canRemove: false, canDelete: true }),
    ).toEqual(['bookmark', 'edit', 'delete']);
  });

  it('curated mill in own pack: Bookmark · Remove', () => {
    expect(
      designSheetMoreIds({ canEdit: false, canRemove: true, canDelete: false }),
    ).toEqual(['bookmark', 'remove']);
  });
});
