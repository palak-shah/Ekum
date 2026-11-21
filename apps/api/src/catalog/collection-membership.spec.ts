import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import {
  activeCollectionMemberWhere,
  hasActivePublishedMemberWhere,
} from './collection-membership';
import {
  collectionHasPublishedMember,
  hasPublishedDesignClause,
} from './collection-schedule';

describe('active membership predicates', () => {
  it('exports excluded: false for buyer-facing joins', () => {
    expect(activeCollectionMemberWhere).toEqual({ excluded: false });
  });

  it('hasPublishedDesignClause requires active + published', () => {
    expect(hasPublishedDesignClause()).toEqual(hasActivePublishedMemberWhere());
    expect(hasActivePublishedMemberWhere()).toEqual({
      products: {
        some: {
          excluded: false,
          product: { status: ProductStatus.Published },
        },
      },
    });
  });

  it('collectionHasPublishedMember ignores excluded rows', () => {
    expect(
      collectionHasPublishedMember([
        { excluded: true, product: { status: ProductStatus.Published } },
        { excluded: false, product: { status: ProductStatus.Draft } },
      ]),
    ).toBe(false);
    expect(
      collectionHasPublishedMember([
        { excluded: true, product: { status: ProductStatus.Published } },
        { excluded: false, product: { status: ProductStatus.Published } },
      ]),
    ).toBe(true);
  });
});
