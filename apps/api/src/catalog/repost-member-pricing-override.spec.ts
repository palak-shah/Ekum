import { describe, expect, it } from 'vitest';
import { RepostPricingMode } from '@ekum/domain-types';
import {
  memberPricingOverrideFromRow,
  packPricingConfigFromRow,
} from './repost-pricing-resolve';

describe('member pricing hasOverride (Batch 4B)', () => {
  it('override null when join has no pricingMode — inherit pack', () => {
    expect(
      memberPricingOverrideFromRow({
        pricingMode: null,
        marginValue: null,
        editedRate: null,
        editOwnBase: null,
      }),
    ).toBeNull();
    const pack = packPricingConfigFromRow({
      repostPricingMode: RepostPricingMode.Same,
      repostMarginValue: null,
      repostEditedRate: null,
      repostEditOwnBase: null,
    });
    expect(pack.mode).toBe(RepostPricingMode.Same);
  });

  it('override present when join carries a mode — hasOverride true', () => {
    const override = memberPricingOverrideFromRow({
      pricingMode: RepostPricingMode.Edit,
      marginValue: null,
      editedRate: { toNumber: () => 150 },
      editOwnBase: { toNumber: () => 100 },
    });
    expect(override).toEqual({
      mode: RepostPricingMode.Edit,
      marginValue: null,
      editedRate: 150,
      editOwnBase: 100,
    });
  });
});
