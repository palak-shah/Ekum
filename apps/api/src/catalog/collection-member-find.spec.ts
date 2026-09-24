import { describe, expect, it } from 'vitest';
import { collectionMemberFind } from './collection-member-find';

describe('collectionMemberFind', () => {
  it('collects unique name, sku, notes, and tags', () => {
    expect(
      collectionMemberFind([
        {
          product: {
            name: 'Banarasi Silk',
            sku: 'EK-1',
            description: '44 inch cotton',
            categories: ['Wedding 2026', 'saree'],
          },
        },
        {
          product: {
            name: 'Banarasi Silk',
            sku: null,
            description: '  ',
            categories: ['saree'],
          },
        },
      ]),
    ).toEqual(['Banarasi Silk', 'EK-1', '44 inch cotton', 'Wedding 2026', 'saree']);
  });

  it('returns empty when members are missing', () => {
    expect(collectionMemberFind(undefined)).toEqual([]);
    expect(collectionMemberFind([])).toEqual([]);
  });
});
