import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import { curatedMemberUnavailableReason, canSetMemberLiveInPack } from './curatedMemberAvailability';

describe('curatedMemberUnavailableReason', () => {
  it('leaves a published design live even if the mill left their album', () => {
    expect(curatedMemberUnavailableReason(ProductStatus.Published)).toBeUndefined();
  });

  it('grays when the mill archived or unpublished the design', () => {
    expect(curatedMemberUnavailableReason(ProductStatus.Archived)).toBe('Archived');
    expect(curatedMemberUnavailableReason(ProductStatus.Draft)).toBe('Not published');
  });

  it('offers Publish only for the owner’s drafts on a live pack', () => {
    expect(
      canSetMemberLiveInPack({
        packPublished: true,
        productStatus: ProductStatus.Draft,
        productCompanyId: 'shop-1',
        ownerCompanyId: 'shop-1',
      }),
    ).toBe(true);
    expect(
      canSetMemberLiveInPack({
        packPublished: false,
        productStatus: ProductStatus.Draft,
        productCompanyId: 'shop-1',
        ownerCompanyId: 'shop-1',
      }),
    ).toBe(false);
    expect(
      canSetMemberLiveInPack({
        packPublished: true,
        productStatus: ProductStatus.Draft,
        productCompanyId: 'mill',
        ownerCompanyId: 'shop-1',
      }),
    ).toBe(false);
  });
});
