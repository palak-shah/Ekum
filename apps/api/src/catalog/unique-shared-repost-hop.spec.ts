import { describe, expect, it } from 'vitest';
import {
  uniqueSharedRepostHop,
  uniqueSharedStringList,
  uniqueSharedValue,
} from '@ekum/domain-types';

describe('uniqueSharedRepostHop', () => {
  it('stamps the pack when every design shares one source collection', () => {
    expect(
      uniqueSharedRepostHop([
        { collectionId: 'mill-pack', productId: 'a' },
        { collectionId: 'mill-pack', productId: 'b' },
      ]),
    ).toEqual({ repostSourceCollectionId: 'mill-pack' });
  });

  it('stamps the design when a single foreign design has no pack', () => {
    expect(uniqueSharedRepostHop([{ productId: 'solo' }])).toEqual({
      repostSourceProductId: 'solo',
    });
  });

  it('omits when sources mix', () => {
    expect(
      uniqueSharedRepostHop([
        { collectionId: 'pack-a', productId: 'a' },
        { collectionId: 'pack-b', productId: 'b' },
      ]),
    ).toEqual({});
  });
});

describe('uniqueSharedValue / uniqueSharedStringList', () => {
  it('copies a shared category and omits mixed tags', () => {
    expect(uniqueSharedValue(['silk', 'silk'])).toBe('silk');
    expect(uniqueSharedValue(['silk', 'cotton'])).toBeNull();
    expect(uniqueSharedStringList([['A', 'B'], ['B', 'A']])).toEqual(['A', 'B']);
    expect(uniqueSharedStringList([['A'], ['B']])).toBeNull();
    expect(uniqueSharedStringList([[], []])).toBeNull();
  });
});
