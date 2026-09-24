import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import { curatedMemberUnavailableReason } from './curatedMemberAvailability';

describe('curatedMemberUnavailableReason', () => {
  it('leaves a published design live even if the mill left their album', () => {
    expect(curatedMemberUnavailableReason(ProductStatus.Published)).toBeUndefined();
  });

  it('grays when the mill archived or unpublished the design', () => {
    expect(curatedMemberUnavailableReason(ProductStatus.Archived)).toBe('Archived');
    expect(curatedMemberUnavailableReason(ProductStatus.Draft)).toBe('Not published');
  });
});
