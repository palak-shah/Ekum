import { describe, expect, it } from 'vitest';
import { groupHowManyByCollection } from './howManyCollectionGroups';

describe('groupHowManyByCollection', () => {
  it('groups by shop + pack and repeats shop when packs differ', () => {
    const groups = groupHowManyByCollection([
      {
        id: 'a',
        companyId: 's1',
        companyName: 'Surat Silk',
        sourceCollectionId: 'c2',
        sourceCollectionName: 'Second',
      },
      {
        id: 'b',
        companyId: 's2',
        companyName: 'Ravi Traders',
        sourceCollectionId: 'c1',
        sourceCollectionName: 'First',
      },
      {
        id: 'c',
        companyId: 's1',
        companyName: 'Surat Silk',
        sourceCollectionId: 'c2',
        sourceCollectionName: 'Second',
      },
      {
        id: 'd',
        companyId: 's1',
        companyName: 'Surat Silk',
        sourceCollectionId: 'c3',
        sourceCollectionName: 'Third',
      },
      { id: 'e', companyId: 's2', companyName: 'Ravi Traders' },
    ]);
    expect(groups.map((g) => g.heading)).toEqual([
      'Surat Silk · Second',
      'Ravi Traders · First',
      'Surat Silk · Third',
      'Ravi Traders',
    ]);
    expect(groups[0]!.items.map((i) => i.id)).toEqual(['a', 'c']);
    expect(groups[2]!.heading).toBe('Surat Silk · Third');
  });

  it('uses collection name alone for a one-shop basket', () => {
    const groups = groupHowManyByCollection([
      {
        id: 'a',
        companyId: 's1',
        companyName: 'Shop',
        sourceCollectionId: 'c1',
        sourceCollectionName: 'Wedding',
      },
      {
        id: 'b',
        companyId: 's1',
        companyName: 'Shop',
        sourceCollectionId: 'c1',
        sourceCollectionName: 'Wedding',
      },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      kind: 'section',
      collectionId: 'c1',
      heading: 'Wedding',
    });
  });

  it('falls back to Collection when the stamp has no name', () => {
    const groups = groupHowManyByCollection([
      { id: 'a', companyId: 's1', companyName: 'Shop', sourceCollectionId: 'c1' },
    ]);
    expect(groups[0]).toMatchObject({
      kind: 'section',
      collectionId: 'c1',
      heading: 'Collection',
    });
  });
});
