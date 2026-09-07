import { describe, expect, it } from 'vitest';
import { CollectionStatus, type CollectionView } from '@ekum/domain-types';
import {
  curateExistingTargets,
  filterCurateTargetsByQuery,
  mergeCollectionProductIds,
} from './curateExisting';

function pack(
  partial: Pick<CollectionView, 'id' | 'name' | 'status'>,
): CollectionView {
  return {
    companyId: 'co',
    memberShops: [],
    description: null,
    coverImage: null,
    audience: 'connections',
    rateVisibility: 'on_request',
    audienceCompanyIds: [],
    audienceGroupIds: [],
    allowForward: true,
    orderPathPreference: null,
    productCount: 1,
    photoCount: 1,
    previewImages: [],
    startsAt: null,
    endsAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('mergeCollectionProductIds', () => {
  it('unions without duplicates, existing order first', () => {
    expect(mergeCollectionProductIds(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('curateExistingTargets', () => {
  it('excludes archived and sorts draft then published', () => {
    const list = curateExistingTargets([
      pack({ id: 'p', name: 'Zebra', status: CollectionStatus.Published }),
      pack({ id: 'a', name: 'Archived', status: CollectionStatus.Archived }),
      pack({ id: 'd', name: 'Alpha', status: CollectionStatus.Draft }),
      pack({ id: 'r', name: 'Beta', status: CollectionStatus.Ready }),
    ]);
    expect(list.map((c) => c.id)).toEqual(['d', 'r', 'p']);
  });
});

describe('filterCurateTargetsByQuery', () => {
  it('filters by name', () => {
    const packs = [
      pack({ id: '1', name: 'Festive 2026', status: CollectionStatus.Draft }),
      pack({ id: '2', name: 'Wedding', status: CollectionStatus.Published }),
    ];
    expect(filterCurateTargetsByQuery(packs, 'fest').map((c) => c.id)).toEqual(['1']);
  });
});
