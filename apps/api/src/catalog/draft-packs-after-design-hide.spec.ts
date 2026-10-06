import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus } from '@ekum/domain-types';
import {
  draftPacksLeftWithoutPublishedDesign,
  draftPublishedPacksWithoutLiveDesign,
  publishedPackIdsWithoutLiveDesign,
  shouldDraftPackAfterDesignHide,
} from './draft-packs-after-design-hide';

describe('shouldDraftPackAfterDesignHide', () => {
  it('does not auto-unpublish the pack when the last live design leaves', () => {
    expect(shouldDraftPackAfterDesignHide(0)).toBe(false);
  });

  it('keeps the pack when another published design remains', () => {
    expect(shouldDraftPackAfterDesignHide(1)).toBe(false);
  });
});

describe('draftPacksLeftWithoutPublishedDesign', () => {
  it('does not draft a published pack whose only live design is this one', async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      collectionProduct: {
        findMany: async () => [{ collectionId: 'col-1' }],
        count: async () => 0,
      },
      collection: { updateMany },
    };
    await expect(draftPacksLeftWithoutPublishedDesign(prisma, 'p1')).resolves.toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('does not draft when another published member remains', async () => {
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const prisma = {
      collectionProduct: {
        findMany: async () => [{ collectionId: 'col-1' }],
        count: async () => 2,
      },
      collection: { updateMany },
    };
    await expect(draftPacksLeftWithoutPublishedDesign(prisma, 'p1')).resolves.toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });
});

describe('publishedPackIdsWithoutLiveDesign', () => {
  it('picks leftover published packs with no live member', async () => {
    expect(
      publishedPackIdsWithoutLiveDesign([
        { id: 'empty', status: CollectionStatus.Published, products: [{ product: { status: 'draft' } }] },
        { id: 'live', status: CollectionStatus.Published, products: [{ product: { status: 'published' } }] },
      ]),
    ).toEqual(['empty']);
    const updateMany = vi.fn(async () => ({ count: 1 }));
    await draftPublishedPacksWithoutLiveDesign(
      { collection: { updateMany } },
      [{ id: 'empty', status: CollectionStatus.Published, products: [] }],
    );
    expect(updateMany).not.toHaveBeenCalled();
  });
});
