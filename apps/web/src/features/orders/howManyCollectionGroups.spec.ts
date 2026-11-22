import { describe, expect, it } from 'vitest';
import { groupHowManyByCollection } from './howManyCollectionGroups';

describe('groupHowManyByCollection', () => {
  it('groups by sourceCollectionId in first-seen order and keeps loose last', () => {
    const groups = groupHowManyByCollection([
      { id: 'a', sourceCollectionId: 'c2', sourceCollectionName: 'Second' },
      { id: 'b', sourceCollectionId: 'c1', sourceCollectionName: 'First' },
      { id: 'c', sourceCollectionId: 'c2', sourceCollectionName: 'Second' },
      { id: 'd' },
      { id: 'e', sourceCollectionId: 'c1', sourceCollectionName: 'First' },
    ]);
    expect(groups).toEqual([
      {
        kind: 'collection',
        collectionId: 'c2',
        name: 'Second',
        items: [
          { id: 'a', sourceCollectionId: 'c2', sourceCollectionName: 'Second' },
          { id: 'c', sourceCollectionId: 'c2', sourceCollectionName: 'Second' },
        ],
      },
      {
        kind: 'collection',
        collectionId: 'c1',
        name: 'First',
        items: [
          { id: 'b', sourceCollectionId: 'c1', sourceCollectionName: 'First' },
          { id: 'e', sourceCollectionId: 'c1', sourceCollectionName: 'First' },
        ],
      },
      { kind: 'loose', items: [{ id: 'd' }] },
    ]);
  });

  it('falls back to Collection when the stamp has no name', () => {
    const groups = groupHowManyByCollection([
      { id: 'a', sourceCollectionId: 'c1' },
    ]);
    expect(groups[0]).toMatchObject({
      kind: 'collection',
      collectionId: 'c1',
      name: 'Collection',
    });
  });
});
