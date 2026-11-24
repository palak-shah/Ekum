import { describe, expect, it } from 'vitest';
import { RepostPricingMode } from '@ekum/domain-types';
import {
  exploreOwnerRateChromeFromCard,
  memberSupplierRateLabel,
  ownerCuratedMarginLabel,
  ownerCuratedRateChrome,
  ownerPackSupplierRateLabel,
  ownerSupplierRateLabel,
} from './ownerSupplierRateCue';

describe('ownerSupplierRateCue', () => {
  it('shows Supplier ₹ for owner curated when disclosed', () => {
    expect(
      ownerSupplierRateLabel({
        isOwner: true,
        isCuratedPack: true,
        sourceRate: 420,
        sourceDisclosed: true,
        catalogRateUnit: 'pc',
      }),
    ).toBe('Supplier ₹420/pc');
  });

  it('hides for visitor, non-curated, or undisclosed', () => {
    expect(
      ownerSupplierRateLabel({
        isOwner: false,
        isCuratedPack: true,
        sourceRate: 420,
        sourceDisclosed: true,
        catalogRateUnit: 'pc',
      }),
    ).toBeNull();
    expect(
      ownerSupplierRateLabel({
        isOwner: true,
        isCuratedPack: false,
        sourceRate: 420,
        sourceDisclosed: true,
        catalogRateUnit: 'pc',
      }),
    ).toBeNull();
    expect(
      ownerSupplierRateLabel({
        isOwner: true,
        isCuratedPack: true,
        sourceRate: 420,
        sourceDisclosed: false,
        catalogRateUnit: 'pc',
      }),
    ).toBeNull();
  });

  it('pack cue only when all disclosed sources match', () => {
    expect(
      ownerPackSupplierRateLabel({
        isOwner: true,
        isCuratedPack: true,
        memberPricing: [
          { productId: 'a', sourceRate: 420, sourceDisclosed: true },
          { productId: 'b', sourceRate: 420, sourceDisclosed: true },
        ],
        catalogRateUnit: 'pc',
      }),
    ).toBe('Supplier ₹420/pc');
    expect(
      ownerPackSupplierRateLabel({
        isOwner: true,
        isCuratedPack: true,
        memberPricing: [
          { productId: 'a', sourceRate: 420, sourceDisclosed: true },
          { productId: 'b', sourceRate: 450, sourceDisclosed: true },
        ],
        catalogRateUnit: 'pc',
      }),
    ).toBeNull();
  });

  it('member cue looks up productId', () => {
    expect(
      memberSupplierRateLabel({
        isOwner: true,
        isCuratedPack: true,
        productId: 'b',
        memberPricing: [
          { productId: 'a', sourceRate: 400, sourceDisclosed: true },
          { productId: 'b', sourceRate: 420, sourceDisclosed: true },
        ],
        catalogRateUnit: 'pc',
      }),
    ).toBe('Supplier ₹420/pc');
  });

  it('margin label only for ±Margin modes — never Edit delta', () => {
    expect(
      ownerCuratedMarginLabel({
        pricingMode: RepostPricingMode.MarginFixed,
        marginValue: 280,
      }),
    ).toBe('Margin ₹280');
    expect(
      ownerCuratedMarginLabel({
        pricingMode: RepostPricingMode.MarginPercent,
        marginValue: 1,
      }),
    ).toBe('Margin 1%');
    expect(
      ownerCuratedMarginLabel({
        pricingMode: RepostPricingMode.Edit,
      }),
    ).toBeNull();
    expect(
      ownerCuratedMarginLabel({
        pricingMode: RepostPricingMode.Same,
      }),
    ).toBeNull();
  });

  it('owner curated chrome: Edit → Your ₹ + Supplier; Margin → Margin only', () => {
    expect(
      ownerCuratedRateChrome({
        isOwner: true,
        isCuratedPack: true,
        yourRate: 700,
        pricingMode: RepostPricingMode.Edit,
        memberPricing: [
          { productId: 'a', sourceRate: 420, sourceDisclosed: true },
          { productId: 'b', sourceRate: 420, sourceDisclosed: true },
        ],
        catalogRateUnit: 'pc',
      }),
    ).toEqual({
      yourRateLabel: '₹700/pc',
      supplierRateLabel: 'Supplier ₹420/pc',
      marginLabel: null,
    });
    expect(
      ownerCuratedRateChrome({
        isOwner: true,
        isCuratedPack: true,
        yourRate: 550,
        pricingMode: RepostPricingMode.MarginFixed,
        marginValue: 465,
        memberPricing: [
          { productId: 'a', sourceRate: 85, sourceDisclosed: true },
        ],
        catalogRateUnit: 'mtr',
      }),
    ).toEqual({
      yourRateLabel: null,
      supplierRateLabel: null,
      marginLabel: 'Margin ₹465',
    });
  });

  it('explore card Edit: Your ₹ on title + Supplier quiet', () => {
    expect(
      exploreOwnerRateChromeFromCard({
        rateMin: 420,
        rateUnit: 'pc',
        viewerReposted: true,
        viewerRepostRateMin: 700,
        viewerRepostRateUnit: 'pc',
        viewerRepostSupplierRateMin: 420,
        viewerRepostPricingMode: RepostPricingMode.Edit,
      }),
    ).toEqual({
      rateLine: '₹700/pc',
      supplierRateLabel: 'Supplier ₹420/pc',
      marginLabel: null,
    });
  });

  it('explore card ±Margin: Margin only — no resulting ₹', () => {
    expect(
      exploreOwnerRateChromeFromCard({
        rateMin: 700,
        rateUnit: 'pc',
        isOwn: true,
        isRepostChild: true,
        ownerSupplierRateMin: 420,
        ownerPricingMode: RepostPricingMode.MarginFixed,
        ownerMarginValue: 280,
      }),
    ).toEqual({
      rateLine: null,
      supplierRateLabel: null,
      marginLabel: 'Margin ₹280',
    });
  });
});
