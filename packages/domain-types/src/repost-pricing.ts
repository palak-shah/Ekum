/**
 * Repost buyer-facing pricing (Batch 3).
 * Ask = existing rateVisibility on_request — never a calculation mode.
 * Source input = immediate upstream resolved buyer-facing (not root mill).
 */

/** Calculation modes only — never `ask`. */
export const RepostPricingMode = {
  Same: 'same',
  MarginFixed: 'margin_fixed',
  MarginPercent: 'margin_percent',
  Edit: 'edit',
} as const;
export type RepostPricingMode =
  (typeof RepostPricingMode)[keyof typeof RepostPricingMode];

export const repostPricingModeValues = [
  RepostPricingMode.Same,
  RepostPricingMode.MarginFixed,
  RepostPricingMode.MarginPercent,
  RepostPricingMode.Edit,
] as const;

export type RepostPricingConfig = {
  mode: RepostPricingMode | null;
  marginValue: number | null;
  editedRate: number | null;
  /** Disclosed source rate used when entering Edit; null = independent quote. */
  editOwnBase: number | null;
};

export type ResolvedRepostPricing = {
  sourceRate: number | null;
  sourceDisclosed: boolean;
  buyerFacing: number | null;
  canQuoteIndependent: boolean;
  /** True when dependent Edit must be re-entered. */
  editInvalidated: boolean;
  mode: RepostPricingMode | null;
};

/** Paisa-safe ₹ rounding used across order billing / equality. */
export function roundRepostRate(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Buyer-facing display/stamp round by Rate per:
 * mtr → nearest 0.25; pc and every other Rate per → nearest ₹1.
 */
export function roundRepostBuyerFacing(
  value: number,
  rateUnit: string | null | undefined,
): number {
  if (!Number.isFinite(value)) return value;
  if (rateUnit === 'mtr') {
    return Math.round(value * 4) / 4;
  }
  return Math.round(value);
}

export function isRepostPricingMode(value: unknown): value is RepostPricingMode {
  return (
    value === RepostPricingMode.Same ||
    value === RepostPricingMode.MarginFixed ||
    value === RepostPricingMode.MarginPercent ||
    value === RepostPricingMode.Edit
  );
}

/**
 * Design override wins only when it carries a complete mode.
 * Partial / mismatched override fields are ignored (inherit pack).
 */
export function effectiveRepostPricingConfig(
  pack: RepostPricingConfig,
  override: Partial<RepostPricingConfig> | null | undefined,
): RepostPricingConfig {
  const mode = override?.mode;
  if (!override || !isRepostPricingMode(mode)) {
    return {
      mode: isRepostPricingMode(pack.mode) ? pack.mode : null,
      marginValue: pack.marginValue,
      editedRate: pack.editedRate,
      editOwnBase: pack.editOwnBase,
    };
  }
  return validateRepostPricingConfig({
    mode,
    marginValue: override.marginValue ?? null,
    editedRate: override.editedRate ?? null,
    editOwnBase: override.editOwnBase ?? null,
  });
}

/**
 * Drop incompatible fields for the selected mode so we never silently mix
 * margin + edit values from a half-filled override.
 */
export function validateRepostPricingConfig(
  config: RepostPricingConfig,
): RepostPricingConfig {
  if (!isRepostPricingMode(config.mode)) {
    return {
      mode: null,
      marginValue: null,
      editedRate: null,
      editOwnBase: null,
    };
  }
  if (
    config.mode === RepostPricingMode.MarginFixed ||
    config.mode === RepostPricingMode.MarginPercent
  ) {
    const margin =
      config.marginValue != null && Number.isFinite(config.marginValue)
        ? config.marginValue
        : null;
    return {
      mode: config.mode,
      marginValue: margin,
      editedRate: null,
      editOwnBase: null,
    };
  }
  if (config.mode === RepostPricingMode.Edit) {
    const edited =
      config.editedRate != null && Number.isFinite(config.editedRate)
        ? config.editedRate
        : null;
    const ownBase =
      config.editOwnBase != null && Number.isFinite(config.editOwnBase)
        ? config.editOwnBase
        : null;
    return {
      mode: RepostPricingMode.Edit,
      marginValue: null,
      editedRate: edited,
      editOwnBase: ownBase,
    };
  }
  // same
  return {
    mode: RepostPricingMode.Same,
    marginValue: null,
    editedRate: null,
    editOwnBase: null,
  };
}

/** Paisa equality for Edit ownBase vs live source (and invalidate matching). */
export function ratesEqual(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return a === b;
  return roundRepostRate(a) === roundRepostRate(b);
}

/**
 * Resolve buyer-facing rate for one design on a repost pack.
 * Restricted / missing source never leaks into Same/Margin outputs.
 */
export function resolveRepostDesignPricing(input: {
  config: RepostPricingConfig;
  /** Immediate upstream resolved buyer-facing (or null when missing). */
  sourceRate: number | null;
  /** Viewer (trader) is authorized to see that source rate. */
  sourceDisclosed: boolean;
  /** Rate per unit — drives buyer-facing ₹1 / 0.25 round. */
  rateUnit?: string | null;
}): ResolvedRepostPricing {
  const config = validateRepostPricingConfig(input.config);
  const sourceDisclosed = input.sourceDisclosed === true;
  const rateUnit = input.rateUnit ?? null;
  const roundFacing = (v: number) => roundRepostBuyerFacing(v, rateUnit);
  // Fail closed: undisclosed source is treated as absent for calc inputs.
  const sourceRate =
    sourceDisclosed &&
    input.sourceRate != null &&
    Number.isFinite(input.sourceRate)
      ? roundRepostRate(input.sourceRate)
      : null;
  const canQuoteIndependent = true;

  if (!config.mode) {
    return {
      sourceRate,
      sourceDisclosed,
      buyerFacing: null,
      canQuoteIndependent,
      editInvalidated: false,
      mode: null,
    };
  }

  if (config.mode === RepostPricingMode.Same) {
    return {
      sourceRate,
      sourceDisclosed,
      buyerFacing: sourceRate != null ? roundFacing(sourceRate) : null,
      canQuoteIndependent,
      editInvalidated: false,
      mode: config.mode,
    };
  }

  if (config.mode === RepostPricingMode.MarginFixed) {
    const margin = config.marginValue;
    const buyerFacing =
      sourceRate != null && margin != null
        ? roundFacing(sourceRate + margin)
        : null;
    return {
      sourceRate,
      sourceDisclosed,
      buyerFacing,
      canQuoteIndependent,
      editInvalidated: false,
      mode: config.mode,
    };
  }

  if (config.mode === RepostPricingMode.MarginPercent) {
    const margin = config.marginValue;
    const buyerFacing =
      sourceRate != null && margin != null
        ? roundFacing(sourceRate * (1 + margin / 100))
        : null;
    return {
      sourceRate,
      sourceDisclosed,
      buyerFacing,
      canQuoteIndependent,
      editInvalidated: false,
      mode: config.mode,
    };
  }

  // Edit
  const ownBase = config.editOwnBase;
  if (ownBase == null) {
    // Independent quote — survives source appear/disappear/restrict/revoke.
    return {
      sourceRate,
      sourceDisclosed,
      buyerFacing:
        config.editedRate != null ? roundFacing(config.editedRate) : null,
      canQuoteIndependent,
      editInvalidated: false,
      mode: config.mode,
    };
  }

  // Dependent Edit: invalidate only when the recorded disclosed basis changed.
  if (!ratesEqual(sourceRate, ownBase)) {
    return {
      sourceRate,
      sourceDisclosed,
      buyerFacing: null,
      canQuoteIndependent,
      editInvalidated: true,
      mode: config.mode,
    };
  }

  return {
    sourceRate,
    sourceDisclosed,
    buyerFacing:
      config.editedRate != null ? roundFacing(config.editedRate) : null,
    canQuoteIndependent,
    editInvalidated: false,
    mode: config.mode,
  };
}

/**
 * Immediate-hop source for a downstream trader.
 * Never fall back to root mill when immediate is missing/restricted.
 * Incomplete lineage → fail closed (null + not disclosed).
 */
export function resolveImmediateSourceInput(input: {
  lineageComplete: boolean;
  immediateBuyerFacing: number | null | undefined;
  immediateDisclosedToTrader: boolean;
}): { sourceRate: number | null; sourceDisclosed: boolean } {
  if (!input.lineageComplete) {
    return { sourceRate: null, sourceDisclosed: false };
  }
  if (!input.immediateDisclosedToTrader) {
    return { sourceRate: null, sourceDisclosed: false };
  }
  const rate = input.immediateBuyerFacing;
  if (rate == null || !Number.isFinite(rate)) {
    return { sourceRate: null, sourceDisclosed: true };
  }
  return { sourceRate: roundRepostRate(rate), sourceDisclosed: true };
}

/**
 * Pack-level Edit may record `editOwnBase` only when every design shares one
 * disclosed source rate (uniform band). A pack `rateMin` alone is not a
 * per-design basis when the band has a high end — use independent Edit
 * (`null`) instead.
 */
export function editOwnBaseFromDisclosedBand(input: {
  rateMin: number | null | undefined;
  rateMax: number | null | undefined;
}): number | null {
  const min = input.rateMin;
  if (min == null || !Number.isFinite(min)) return null;
  const max = input.rateMax;
  if (max != null && Number.isFinite(max) && roundRepostRate(max) !== roundRepostRate(min)) {
    return null;
  }
  return roundRepostRate(min);
}
