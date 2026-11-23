/**
 * Shared Batch 3 / 4B pricing form helpers — pack publish + design override.
 * Ask stays rateVisibility; never invent ask as a calc mode.
 */

import {
  RateVisibility,
  RepostPricingMode,
  editOwnBaseFromDisclosedBand,
  isRepostPricingMode,
  type PublishCollectionDto,
  type RepostPricingMode as RepostPricingModeValue,
  type SetRepostMemberPricingDto,
} from '@ekum/domain-types';

export type RepostPricingFormState = {
  mode: RepostPricingModeValue | null;
  marginValue: string;
  editedRate: string;
};

export const emptyRepostPricingForm = (): RepostPricingFormState => ({
  mode: RepostPricingMode.Same,
  marginValue: '',
  editedRate: '',
});

/** Pack-level default for new reposts. */
export const defaultPackRepostPricingForm = (): RepostPricingFormState => ({
  mode: RepostPricingMode.Same,
  marginValue: '',
  editedRate: '',
});

export function repostPricingFormFromPack(input: {
  repostPricingMode?: string | null;
  repostMarginValue?: number | null;
  repostEditedRate?: number | null;
}): RepostPricingFormState {
  if (!isRepostPricingMode(input.repostPricingMode)) {
    return defaultPackRepostPricingForm();
  }
  return {
    mode: input.repostPricingMode,
    marginValue:
      input.repostMarginValue != null && Number.isFinite(input.repostMarginValue)
        ? String(input.repostMarginValue)
        : '',
    editedRate:
      input.repostEditedRate != null && Number.isFinite(input.repostEditedRate)
        ? String(input.repostEditedRate)
        : '',
  };
}

/**
 * Design override form. Null mode = inherit pack (explicit clear).
 * When the stored override matches pack, still treat as inherit if API sent pack mode
 * without a true override — callers pass `hasOverride`.
 */
export function repostPricingFormFromMember(input: {
  pricingMode: string | null;
  marginValue: number | null;
  editedRate: number | null;
  /** When false, start on inherit (null mode). */
  hasOverride: boolean;
}): RepostPricingFormState {
  if (!input.hasOverride || !isRepostPricingMode(input.pricingMode)) {
    return { mode: null, marginValue: '', editedRate: '' };
  }
  return {
    mode: input.pricingMode,
    marginValue:
      input.marginValue != null && Number.isFinite(input.marginValue)
        ? String(input.marginValue)
        : '',
    editedRate:
      input.editedRate != null && Number.isFinite(input.editedRate)
        ? String(input.editedRate)
        : '',
  };
}

export function repostPricingFormReady(
  form: RepostPricingFormState,
  opts: { allowInherit?: boolean } = {},
): boolean {
  if (form.mode == null) return Boolean(opts.allowInherit);
  if (form.mode === RepostPricingMode.Same) return true;
  if (
    form.mode === RepostPricingMode.MarginFixed ||
    form.mode === RepostPricingMode.MarginPercent
  ) {
    return form.marginValue.trim() !== '' && Number.isFinite(Number(form.marginValue));
  }
  if (form.mode === RepostPricingMode.Edit) {
    return form.editedRate.trim() !== '' && Number.isFinite(Number(form.editedRate));
  }
  return false;
}

/** Show rates ON = buyers see calc ₹ (`visible`). OFF / Ask = `on_request`. */
export function exploreShowRatesOn(rateVisibility: string | null | undefined): boolean {
  return rateVisibility === RateVisibility.Visible;
}

export function isFiniteRateDraft(value: string | null | undefined): boolean {
  const trimmed = (value ?? '').trim();
  return trimmed !== '' && Number.isFinite(Number(trimmed));
}

/**
 * Explore Repost Edit ready — every listed design needs a selling ₹.
 * Empty product list falls back to pack `editedRate`.
 */
export function repostEditDesignsReady(
  productIds: string[],
  editRatesByProductId: Record<string, string>,
  packEditedRate?: string,
): boolean {
  if (productIds.length === 0) {
    return isFiniteRateDraft(packEditedRate);
  }
  return productIds.every((id) => isFiniteRateDraft(editRatesByProductId[id]));
}

/** Calc gate for Explore Repost: skip when Show rates is OFF. */
export function repostSheetPricingReady(input: {
  showRates: boolean;
  form: RepostPricingFormState;
  editProductIds?: string[];
  editRatesByProductId?: Record<string, string>;
}): boolean {
  if (!input.showRates) return true;
  if (input.form.mode === RepostPricingMode.Edit && (input.editProductIds?.length ?? 0) > 0) {
    return repostEditDesignsReady(
      input.editProductIds ?? [],
      input.editRatesByProductId ?? {},
      input.form.editedRate,
    );
  }
  return repostPricingFormReady(input.form);
}

/** Prototype three-way: Same | Edit | Margin (₹/% is a sub-control). */
export function prototypeMarginChoice(
  mode: RepostPricingModeValue | null,
): 'fixed' | 'percent' {
  return mode === RepostPricingMode.MarginPercent ? 'percent' : 'fixed';
}

export function isPrototypeMarginMode(mode: RepostPricingModeValue | null): boolean {
  return (
    mode === RepostPricingMode.MarginFixed || mode === RepostPricingMode.MarginPercent
  );
}

/**
 * One of Same | Edit | ± Margin — clear the inactive field drafts.
 * ₹/% stays a sub-control under Margin (mode already MarginFixed/Percent).
 */
export function withExclusiveRepostPricingMode(
  prev: RepostPricingFormState,
  mode: RepostPricingModeValue | null,
): RepostPricingFormState {
  if (mode == null || mode === RepostPricingMode.Same) {
    return { mode: RepostPricingMode.Same, marginValue: '', editedRate: '' };
  }
  if (isPrototypeMarginMode(mode)) {
    return {
      mode,
      marginValue: prev.marginValue,
      editedRate: '',
    };
  }
  if (mode === RepostPricingMode.Edit) {
    return {
      mode: RepostPricingMode.Edit,
      marginValue: '',
      editedRate: prev.editedRate,
    };
  }
  return { mode: RepostPricingMode.Same, marginValue: '', editedRate: '' };
}

/** Hydrate from pack with exclusive drafts (margin XOR edited). */
export function exclusiveRepostPricingFormFromPack(input: {
  repostPricingMode?: string | null;
  repostMarginValue?: number | null;
  repostEditedRate?: number | null;
}): RepostPricingFormState {
  const raw = repostPricingFormFromPack(input);
  return withExclusiveRepostPricingMode(raw, raw.mode);
}

export function publishPricingFieldsFromForm(
  form: RepostPricingFormState,
  sourceBand: { rateMin?: number | null; rateMax?: number | null },
): Pick<
  PublishCollectionDto,
  'repostPricingMode' | 'repostMarginValue' | 'repostEditedRate' | 'repostEditOwnBase'
> {
  const mode = form.mode ?? RepostPricingMode.Same;
  const marginNum = Number(form.marginValue);
  const editedNum = Number(form.editedRate);
  if (
    mode === RepostPricingMode.MarginFixed ||
    mode === RepostPricingMode.MarginPercent
  ) {
    return {
      repostPricingMode: mode,
      repostMarginValue: Number.isFinite(marginNum) ? marginNum : null,
      repostEditedRate: null,
      repostEditOwnBase: null,
    };
  }
  if (mode === RepostPricingMode.Edit) {
    return {
      repostPricingMode: mode,
      repostMarginValue: null,
      repostEditedRate: Number.isFinite(editedNum) ? editedNum : null,
      repostEditOwnBase: editOwnBaseFromDisclosedBand({
        rateMin: sourceBand.rateMin,
        rateMax: sourceBand.rateMax,
      }),
    };
  }
  return {
    repostPricingMode: RepostPricingMode.Same,
    repostMarginValue: null,
    repostEditedRate: null,
    repostEditOwnBase: null,
  };
}

export function memberPricingDtoFromForm(
  productId: string,
  form: RepostPricingFormState,
  sourceRate: number | null | undefined,
): SetRepostMemberPricingDto {
  if (form.mode == null) {
    return {
      productId,
      pricingMode: null,
      marginValue: null,
      editedRate: null,
      editOwnBase: null,
    };
  }
  const marginNum = Number(form.marginValue);
  const editedNum = Number(form.editedRate);
  if (
    form.mode === RepostPricingMode.MarginFixed ||
    form.mode === RepostPricingMode.MarginPercent
  ) {
    return {
      productId,
      pricingMode: form.mode,
      marginValue: Number.isFinite(marginNum) ? marginNum : null,
      editedRate: null,
      editOwnBase: null,
    };
  }
  if (form.mode === RepostPricingMode.Edit) {
    const basis =
      sourceRate != null && Number.isFinite(sourceRate) ? sourceRate : null;
    return {
      productId,
      pricingMode: form.mode,
      marginValue: null,
      editedRate: Number.isFinite(editedNum) ? editedNum : null,
      // Dependent Edit stamps disclosed source; null = independent quote.
      editOwnBase: basis,
    };
  }
  return {
    productId,
    pricingMode: RepostPricingMode.Same,
    marginValue: null,
    editedRate: null,
    editOwnBase: null,
  };
}

export function packPricingModeLabel(mode: string | null | undefined): string {
  if (mode === RepostPricingMode.MarginFixed) return '+ / − Margin (₹)';
  if (mode === RepostPricingMode.MarginPercent) return '+ / − Margin (%)';
  if (mode === RepostPricingMode.Edit) return 'Edit rate';
  if (mode === RepostPricingMode.Same) return 'Same rate';
  return 'Same rate';
}

/** True when owner GET attached memberPricing (repost pack). */
export function collectionHasRepostPricingSurface(input: {
  memberPricing?: unknown;
  repostPricingMode?: string | null;
  hasForeignMembers?: boolean;
}): boolean {
  if (Array.isArray(input.memberPricing)) return true;
  if (isRepostPricingMode(input.repostPricingMode)) return true;
  return Boolean(input.hasForeignMembers);
}
