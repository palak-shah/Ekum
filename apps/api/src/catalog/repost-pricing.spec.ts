import { describe, expect, it } from 'vitest';
import {
  RepostPricingMode,
  editOwnBaseFromDisclosedBand,
  effectiveRepostPricingConfig,
  resolveImmediateSourceInput,
  resolveRepostDesignPricing,
  roundRepostBuyerFacing,
  roundRepostRate,
  validateRepostPricingConfig,
} from '@ekum/domain-types';

describe('repost pricing resolver (Batch 3)', () => {
  it('rounds to paisa', () => {
    expect(roundRepostRate(10.006)).toBe(10.01);
    expect(roundRepostRate(10.004)).toBe(10);
  });

  it('buyer-facing rounds ₹1/pc and 0.25/mtr', () => {
    expect(roundRepostBuyerFacing(424.2, 'pc')).toBe(424);
    expect(roundRepostBuyerFacing(424.6, 'pc')).toBe(425);
    expect(roundRepostBuyerFacing(10.1, 'mtr')).toBe(10);
    expect(roundRepostBuyerFacing(10.2, 'mtr')).toBe(10.25);
    expect(roundRepostBuyerFacing(10.4, 'set')).toBe(10);
  });

  it('Same uses disclosed source; restricted source yields null', () => {
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.Same,
          marginValue: null,
          editedRate: null,
          editOwnBase: null,
        },
        sourceRate: 100,
        sourceDisclosed: true,
      }).buyerFacing,
    ).toBe(100);
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.Same,
          marginValue: null,
          editedRate: null,
          editOwnBase: null,
        },
        sourceRate: 100,
        sourceDisclosed: false,
      }).buyerFacing,
    ).toBeNull();
  });

  it('fixed and percent margin recalculate from disclosed source', () => {
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.MarginFixed,
          marginValue: 15,
          editedRate: null,
          editOwnBase: null,
        },
        sourceRate: 100,
        sourceDisclosed: true,
      }).buyerFacing,
    ).toBe(115);
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.MarginPercent,
          marginValue: 10,
          editedRate: null,
          editOwnBase: null,
        },
        sourceRate: 200,
        sourceDisclosed: true,
        rateUnit: 'pc',
      }).buyerFacing,
    ).toBe(220);
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.MarginPercent,
          marginValue: 1,
          editedRate: null,
          editOwnBase: null,
        },
        sourceRate: 420,
        sourceDisclosed: true,
        rateUnit: 'pc',
      }).buyerFacing,
    ).toBe(424);
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.MarginFixed,
          marginValue: -5,
          editedRate: null,
          editOwnBase: null,
        },
        sourceRate: 420,
        sourceDisclosed: true,
        rateUnit: 'pc',
      }).buyerFacing,
    ).toBe(415);
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.MarginFixed,
          marginValue: 15,
          editedRate: null,
          editOwnBase: null,
        },
        sourceRate: 100,
        sourceDisclosed: false,
      }).buyerFacing,
    ).toBeNull();
  });

  it('dependent Edit invalidates only when recorded ownBase changes', () => {
    const base = {
      mode: RepostPricingMode.Edit,
      marginValue: null,
      editedRate: 150,
      editOwnBase: 100,
    };
    expect(
      resolveRepostDesignPricing({
        config: base,
        sourceRate: 100,
        sourceDisclosed: true,
      }),
    ).toMatchObject({ buyerFacing: 150, editInvalidated: false });
    expect(
      resolveRepostDesignPricing({
        config: base,
        sourceRate: 110,
        sourceDisclosed: true,
      }),
    ).toMatchObject({ buyerFacing: null, editInvalidated: true });
    expect(
      resolveRepostDesignPricing({
        config: base,
        sourceRate: 100,
        sourceDisclosed: false,
      }),
    ).toMatchObject({ buyerFacing: null, editInvalidated: true });
  });

  it('independent Edit (ownBase null) survives source appear/restrict/revoke', () => {
    const independent = {
      mode: RepostPricingMode.Edit,
      marginValue: null,
      editedRate: 175,
      editOwnBase: null,
    };
    expect(
      resolveRepostDesignPricing({
        config: independent,
        sourceRate: null,
        sourceDisclosed: false,
      }).buyerFacing,
    ).toBe(175);
    expect(
      resolveRepostDesignPricing({
        config: independent,
        sourceRate: 90,
        sourceDisclosed: true,
      }).buyerFacing,
    ).toBe(175);
    expect(
      resolveRepostDesignPricing({
        config: independent,
        sourceRate: 90,
        sourceDisclosed: false,
      }).buyerFacing,
    ).toBe(175);
  });

  it('design override takes precedence; null mode inherits pack', () => {
    const pack = {
      mode: RepostPricingMode.Same,
      marginValue: null,
      editedRate: null,
      editOwnBase: null,
    };
    expect(effectiveRepostPricingConfig(pack, null).mode).toBe(
      RepostPricingMode.Same,
    );
    expect(
      effectiveRepostPricingConfig(pack, {
        mode: RepostPricingMode.MarginFixed,
        marginValue: 5,
      }),
    ).toEqual({
      mode: RepostPricingMode.MarginFixed,
      marginValue: 5,
      editedRate: null,
      editOwnBase: null,
    });
  });

  it('does not silently mix incompatible override fields', () => {
    expect(
      validateRepostPricingConfig({
        mode: RepostPricingMode.Same,
        marginValue: 10,
        editedRate: 99,
        editOwnBase: 50,
      }),
    ).toEqual({
      mode: RepostPricingMode.Same,
      marginValue: null,
      editedRate: null,
      editOwnBase: null,
    });
  });

  it('immediate-hop source never falls back to root; incomplete fails closed', () => {
    expect(
      resolveImmediateSourceInput({
        lineageComplete: false,
        immediateBuyerFacing: 50,
        immediateDisclosedToTrader: true,
      }),
    ).toEqual({ sourceRate: null, sourceDisclosed: false });
    expect(
      resolveImmediateSourceInput({
        lineageComplete: true,
        immediateBuyerFacing: null,
        immediateDisclosedToTrader: true,
      }),
    ).toEqual({ sourceRate: null, sourceDisclosed: true });
    expect(
      resolveImmediateSourceInput({
        lineageComplete: true,
        immediateBuyerFacing: 80,
        immediateDisclosedToTrader: false,
      }),
    ).toEqual({ sourceRate: null, sourceDisclosed: false });
  });

  it('pack editOwnBase only from a uniform disclosed band — never bare rateMin', () => {
    expect(
      editOwnBaseFromDisclosedBand({ rateMin: 100, rateMax: null }),
    ).toBe(100);
    expect(
      editOwnBaseFromDisclosedBand({ rateMin: 100, rateMax: 100 }),
    ).toBe(100);
    // Multi-design band: rateMin is not each design’s basis → independent Edit.
    expect(
      editOwnBaseFromDisclosedBand({ rateMin: 100, rateMax: 150 }),
    ).toBeNull();
    expect(
      editOwnBaseFromDisclosedBand({ rateMin: null, rateMax: null }),
    ).toBeNull();
  });

  it('dependent Edit with pack ownBase=rateMin wrongly invalidates higher designs', () => {
    // Documents why editOwnBaseFromDisclosedBand must reject multi-rate bands.
    const packOwnBaseFromRateMin = 100;
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.Edit,
          marginValue: null,
          editedRate: 160,
          editOwnBase: packOwnBaseFromRateMin,
        },
        sourceRate: 150,
        sourceDisclosed: true,
      }),
    ).toMatchObject({ buyerFacing: null, editInvalidated: true });
    // Independent quote (null ownBase) keeps the edit for every design.
    expect(
      resolveRepostDesignPricing({
        config: {
          mode: RepostPricingMode.Edit,
          marginValue: null,
          editedRate: 160,
          editOwnBase: null,
        },
        sourceRate: 150,
        sourceDisclosed: true,
      }).buyerFacing,
    ).toBe(160);
  });

  it('multi-hop: C uses B buyer-facing as source, not mill root', () => {
    const millRate = 100;
    const b = resolveRepostDesignPricing({
      config: {
        mode: RepostPricingMode.MarginFixed,
        marginValue: 20,
        editedRate: null,
        editOwnBase: null,
      },
      sourceRate: millRate,
      sourceDisclosed: true,
    });
    expect(b.buyerFacing).toBe(120);
    const c = resolveRepostDesignPricing({
      config: {
        mode: RepostPricingMode.MarginPercent,
        marginValue: 10,
        editedRate: null,
        editOwnBase: null,
      },
      // Immediate hop is B — never mill 100 when B is present.
      sourceRate: b.buyerFacing,
      sourceDisclosed: true,
    });
    expect(c.buyerFacing).toBe(132);
    // If B restricted for C, do not fall back to mill.
    const cBlocked = resolveRepostDesignPricing({
      config: {
        mode: RepostPricingMode.MarginPercent,
        marginValue: 10,
        editedRate: null,
        editOwnBase: null,
      },
      ...resolveImmediateSourceInput({
        lineageComplete: true,
        immediateBuyerFacing: null,
        immediateDisclosedToTrader: false,
      }),
    });
    expect(cBlocked.buyerFacing).toBeNull();
    expect(cBlocked.sourceRate).toBeNull();
  });
});
