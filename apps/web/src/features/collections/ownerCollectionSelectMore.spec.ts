import { describe, expect, it } from 'vitest';
import { ownerCollectionSelectMoreIds } from './ownerCollectionSelectMore';

describe('ownerCollectionSelectMoreIds', () => {
  it('Bookmark designs · Remove · Delete last', () => {
    expect(ownerCollectionSelectMoreIds()).toEqual(['bookmark', 'remove', 'delete']);
  });
});
