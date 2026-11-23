import { describe, expect, it } from 'vitest';
import { RepostPricingMode } from '@ekum/domain-types';
import { RateVisibility } from '@ekum/domain-types';
import {
  collectionHasRepostPricingSurface,
  defaultPackRepostPricingForm,
  exclusiveRepostPricingFormFromPack,
  exploreShowRatesOn,
  memberPricingDtoFromForm,
  publishPricingFieldsFromForm,
  repostEditDesignsReady,
  repostPricingFormFromMember,
  repostPricingFormFromPack,
  repostPricingFormReady,
  repostSheetPricingReady,
  withExclusiveRepostPricingMode,
} from './repostPricingForm';

describe('repostPricingForm', () => {
  it('exclusive mode clears the inactive drafts', () => {
    const fromEdit = withExclusiveRepostPricingMode(
      { mode: RepostPricingMode.Edit, marginValue: '5', editedRate: '140' },
      RepostPricingMode.MarginFixed,
    );
    expect(fromEdit).toEqual({
      mode: RepostPricingMode.MarginFixed,
      marginValue: '5',
      editedRate: '',
    });
    const fromMargin = withExclusiveRepostPricingMode(
      { mode: RepostPricingMode.MarginFixed, marginValue: '10', editedRate: '99' },
      RepostPricingMode.Edit,
    );
    expect(fromMargin).toEqual({
      mode: RepostPricingMode.Edit,
      marginValue: '',
      editedRate: '99',
    });
    expect(
      withExclusiveRepostPricingMode(
        { mode: RepostPricingMode.Edit, marginValue: '3', editedRate: '50' },
        RepostPricingMode.Same,
      ),
    ).toEqual({ mode: RepostPricingMode.Same, marginValue: '', editedRate: '' });
    // Empty margin → 0 so Repost stays enabled
    expect(
      withExclusiveRepostPricingMode(
        { mode: RepostPricingMode.Same, marginValue: '', editedRate: '' },
        RepostPricingMode.MarginPercent,
      ),
    ).toEqual({
      mode: RepostPricingMode.MarginPercent,
      marginValue: '0',
      editedRate: '',
    });
  });

  it('hydrate from pack drops sibling field for exclusive mode', () => {
    expect(
      exclusiveRepostPricingFormFromPack({
        repostPricingMode: RepostPricingMode.MarginFixed,
        repostMarginValue: 10,
        repostEditedRate: 125,
      }),
    ).toEqual({
      mode: RepostPricingMode.MarginFixed,
      marginValue: '10',
      editedRate: '',
    });
  });

  it('pack form ready for Same; margin/edit need values', () => {
    expect(repostPricingFormReady(defaultPackRepostPricingForm())).toBe(true);
    expect(
      repostPricingFormReady({
        mode: RepostPricingMode.MarginFixed,
        marginValue: '',
        editedRate: '',
      }),
    ).toBe(false);
    expect(
      repostPricingFormReady({
        mode: RepostPricingMode.MarginFixed,
        marginValue: '10',
        editedRate: '',
      }),
    ).toBe(true);
    expect(
      repostPricingFormReady({
        mode: RepostPricingMode.Edit,
        marginValue: '',
        editedRate: '150',
      }),
    ).toBe(true);
  });

  it('inherit (null mode) ready only when allowInherit', () => {
    const inherit = { mode: null, marginValue: '', editedRate: '' };
    expect(repostPricingFormReady(inherit)).toBe(false);
    expect(repostPricingFormReady(inherit, { allowInherit: true })).toBe(true);
  });

  it('publish DTO keeps Show rates out — only calc fields', () => {
    expect(
      publishPricingFieldsFromForm(
        {
          mode: RepostPricingMode.MarginPercent,
          marginValue: '5',
          editedRate: '',
        },
        { rateMin: 100, rateMax: 100 },
      ),
    ).toEqual({
      repostPricingMode: RepostPricingMode.MarginPercent,
      repostMarginValue: 5,
      repostEditedRate: null,
      repostEditOwnBase: null,
    });
    expect(
      publishPricingFieldsFromForm(
        {
          mode: RepostPricingMode.Edit,
          marginValue: '',
          editedRate: '140',
        },
        { rateMin: 100, rateMax: 100 },
      ),
    ).toEqual({
      repostPricingMode: RepostPricingMode.Edit,
      repostMarginValue: null,
      repostEditedRate: 140,
      repostEditOwnBase: 100,
    });
    // Multi-rate band → independent Edit (null ownBase)
    expect(
      publishPricingFieldsFromForm(
        {
          mode: RepostPricingMode.Edit,
          marginValue: '',
          editedRate: '140',
        },
        { rateMin: 100, rateMax: 120 },
      ).repostEditOwnBase,
    ).toBeNull();
  });

  it('member DTO: null mode clears override; Edit stamps disclosed source', () => {
    expect(memberPricingDtoFromForm('p1', { mode: null, marginValue: '', editedRate: '' }, 90)).toEqual(
      {
        productId: 'p1',
        pricingMode: null,
        marginValue: null,
        editedRate: null,
        editOwnBase: null,
      },
    );
    expect(
      memberPricingDtoFromForm(
        'p1',
        { mode: RepostPricingMode.Edit, marginValue: '', editedRate: '110' },
        90,
      ),
    ).toEqual({
      productId: 'p1',
      pricingMode: RepostPricingMode.Edit,
      marginValue: null,
      editedRate: 110,
      editOwnBase: 90,
    });
  });

  it('hydrate pack + member inherit vs override', () => {
    expect(
      repostPricingFormFromPack({
        repostPricingMode: RepostPricingMode.MarginFixed,
        repostMarginValue: 12,
        repostEditedRate: null,
      }),
    ).toEqual({
      mode: RepostPricingMode.MarginFixed,
      marginValue: '12',
      editedRate: '',
    });
    expect(
      repostPricingFormFromMember({
        pricingMode: RepostPricingMode.Same,
        marginValue: null,
        editedRate: null,
        hasOverride: false,
      }).mode,
    ).toBeNull();
    expect(
      repostPricingFormFromMember({
        pricingMode: RepostPricingMode.Edit,
        marginValue: null,
        editedRate: 99,
        hasOverride: true,
      }),
    ).toEqual({
      mode: RepostPricingMode.Edit,
      marginValue: '',
      editedRate: '99',
    });
  });

  it('surface gate for editor/curate', () => {
    expect(collectionHasRepostPricingSurface({ hasForeignMembers: true })).toBe(true);
    expect(collectionHasRepostPricingSurface({ memberPricing: [] })).toBe(true);
    expect(
      collectionHasRepostPricingSurface({
        repostPricingMode: RepostPricingMode.Same,
      }),
    ).toBe(true);
    expect(collectionHasRepostPricingSurface({})).toBe(false);
  });

  it('Show rates ON is visible only; OFF skips calc ready', () => {
    expect(exploreShowRatesOn(RateVisibility.Visible)).toBe(true);
    expect(exploreShowRatesOn(RateVisibility.OnRequest)).toBe(false);
    expect(
      repostSheetPricingReady({
        showRates: false,
        form: {
          mode: RepostPricingMode.MarginFixed,
          marginValue: '',
          editedRate: '',
        },
      }),
    ).toBe(true);
    expect(
      repostSheetPricingReady({
        showRates: true,
        form: {
          mode: RepostPricingMode.MarginFixed,
          marginValue: '',
          editedRate: '',
        },
      }),
    ).toBe(false);
  });

  it('pack Edit ready uses collection editedRate only', () => {
    expect(repostEditDesignsReady(['a', 'b'], {}, '140')).toBe(true);
    expect(repostEditDesignsReady(['a', 'b'], { a: '10', b: '12' }, '')).toBe(false);
    expect(
      repostSheetPricingReady({
        showRates: true,
        form: { mode: RepostPricingMode.Edit, marginValue: '', editedRate: '150' },
        editProductIds: ['a', 'b'],
        editRatesByProductId: {},
      }),
    ).toBe(true);
    expect(
      repostSheetPricingReady({
        showRates: true,
        form: { mode: RepostPricingMode.Edit, marginValue: '', editedRate: '' },
      }),
    ).toBe(false);
  });
});
