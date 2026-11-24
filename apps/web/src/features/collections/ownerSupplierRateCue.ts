import { RepostPricingMode, isRepostPricingMode } from '@ekum/domain-types';
import { formatCatalogRate } from '@/lib/catalogRate';

export type OwnerSupplierRateMember = {
  productId: string;
  sourceRate: number | null;
  sourceDisclosed: boolean;
  buyerFacing?: number | null;
};

export type OwnerCuratedRateChrome = {
  yourRateLabel: string | null;
  supplierRateLabel: string | null;
  marginLabel: string | null;
};

/**
 * Quiet owner-only Supplier ₹ line for curated/repost albums.
 * Uses memberPricing.sourceRate when disclosed — never for visitors.
 */
export function ownerSupplierRateLabel(input: {
  isOwner: boolean;
  isCuratedPack: boolean;
  sourceRate?: number | null;
  sourceDisclosed?: boolean;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
}): string | null {
  if (!input.isOwner || !input.isCuratedPack) return null;
  if (input.sourceDisclosed !== true || input.sourceRate == null) return null;
  if (!Number.isFinite(input.sourceRate)) return null;
  const rate = formatCatalogRate({
    rate: input.sourceRate,
    unit: input.unit,
    dispatchUnit: input.dispatchUnit,
    catalogRateUnit: input.catalogRateUnit,
  });
  if (!rate || rate === 'On request') return null;
  return `Supplier ${rate}`;
}

/** Pack-level cue when every disclosed member shares one source ₹ (else omit). */
export function ownerPackSupplierRateLabel(input: {
  isOwner: boolean;
  isCuratedPack: boolean;
  memberPricing?: OwnerSupplierRateMember[] | null;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
}): string | null {
  if (!input.isOwner || !input.isCuratedPack) return null;
  const rows = (input.memberPricing ?? []).filter(
    (row) => row.sourceDisclosed === true && row.sourceRate != null && Number.isFinite(row.sourceRate),
  );
  if (rows.length === 0) return null;
  const first = rows[0]!.sourceRate!;
  if (!rows.every((row) => row.sourceRate === first)) return null;
  return ownerSupplierRateLabel({
    isOwner: true,
    isCuratedPack: true,
    sourceRate: first,
    sourceDisclosed: true,
    unit: input.unit,
    dispatchUnit: input.dispatchUnit,
    catalogRateUnit: input.catalogRateUnit,
  });
}

export function memberSupplierRateLabel(input: {
  isOwner: boolean;
  isCuratedPack: boolean;
  productId: string;
  memberPricing?: OwnerSupplierRateMember[] | null;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
}): string | null {
  if (!input.isOwner || !input.isCuratedPack) return null;
  const row = (input.memberPricing ?? []).find((entry) => entry.productId === input.productId);
  if (!row) return null;
  return ownerSupplierRateLabel({
    isOwner: true,
    isCuratedPack: true,
    sourceRate: row.sourceRate,
    sourceDisclosed: row.sourceDisclosed,
    unit: input.unit,
    dispatchUnit: input.dispatchUnit,
    catalogRateUnit: input.catalogRateUnit,
  });
}

/** Uniform disclosed source ₹ from memberPricing rows (else null). */
export function uniformDisclosedSourceRate(
  memberPricing?: OwnerSupplierRateMember[] | null,
): number | null {
  const rows = (memberPricing ?? []).filter(
    (row) => row.sourceDisclosed === true && row.sourceRate != null && Number.isFinite(row.sourceRate),
  );
  if (rows.length === 0) return null;
  const first = rows[0]!.sourceRate!;
  if (!rows.every((row) => row.sourceRate === first)) return null;
  return first;
}

/**
 * Quiet Margin line for owner curated chrome.
 * ±Margin modes only — never Edit delta (resulting ₹ is case-based per design).
 */
export function ownerCuratedMarginLabel(input: {
  pricingMode?: string | null;
  marginValue?: number | null;
}): string | null {
  const mode = input.pricingMode;
  if (!isRepostPricingMode(mode) || mode === RepostPricingMode.Same) return null;
  if (mode === RepostPricingMode.MarginFixed) {
    const n = input.marginValue;
    if (n == null || !Number.isFinite(n)) return null;
    const abs = Math.abs(n);
    const rupee = Number.isInteger(abs) ? String(abs) : String(abs);
    return n < 0 ? `Margin −₹${rupee}` : `Margin ₹${rupee}`;
  }
  if (mode === RepostPricingMode.MarginPercent) {
    const n = input.marginValue;
    if (n == null || !Number.isFinite(n)) return null;
    return `Margin ${n}%`;
  }
  // Edit / other → no Margin cue (title + Supplier only).
  return null;
}

function formatRateLine(input: {
  rate?: number | null;
  rateMax?: number | null;
  unit?: string | null;
  catalogRateUnit?: string | null;
}): string | null {
  if (input.rate == null || !Number.isFinite(input.rate)) return null;
  const label = formatCatalogRate({
    rate: input.rate,
    rateMax: input.rateMax,
    unit: input.unit,
    catalogRateUnit: input.catalogRateUnit,
  });
  return label && label !== 'On request' ? label : null;
}

/**
 * Mode-silent owner chrome:
 * Edit → Your ₹ + Supplier (no Margin).
 * ±Margin → Margin only (never “becomes ₹” — per-design when pack rate blank).
 * Same → buyer-facing + Supplier when disclosed.
 */
export function ownerCuratedRateChrome(input: {
  isOwner: boolean;
  isCuratedPack: boolean;
  yourRate?: number | null;
  yourRateMax?: number | null;
  memberPricing?: OwnerSupplierRateMember[] | null;
  pricingMode?: string | null;
  marginValue?: number | null;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
}): OwnerCuratedRateChrome {
  if (!input.isOwner || !input.isCuratedPack) {
    return { yourRateLabel: null, supplierRateLabel: null, marginLabel: null };
  }
  const mode = input.pricingMode;
  const supplierRateLabel = ownerPackSupplierRateLabel({
    isOwner: true,
    isCuratedPack: true,
    memberPricing: input.memberPricing,
    unit: input.unit,
    dispatchUnit: input.dispatchUnit,
    catalogRateUnit: input.catalogRateUnit,
  });
  const marginLabel = ownerCuratedMarginLabel({
    pricingMode: mode,
    marginValue: input.marginValue,
  });
  const yourRateLabel = formatRateLine({
    rate: input.yourRate,
    rateMax: input.yourRateMax,
    unit: input.unit,
    catalogRateUnit: input.catalogRateUnit,
  });
  if (mode === RepostPricingMode.Edit) {
    return { yourRateLabel, supplierRateLabel, marginLabel: null };
  }
  if (
    mode === RepostPricingMode.MarginFixed ||
    mode === RepostPricingMode.MarginPercent
  ) {
    return { yourRateLabel: null, supplierRateLabel: null, marginLabel };
  }
  return { yourRateLabel, supplierRateLabel, marginLabel: null };
}

/** Explore feed mode-silent chrome from card stamps (viewerReposted or own child). */
export function exploreOwnerRateChromeFromCard(input: {
  rateMin?: number | null;
  rateMax?: number | null;
  rateUnit?: string | null;
  isOwn?: boolean;
  isRepostChild?: boolean;
  viewerReposted?: boolean;
  viewerRepostRateMin?: number | null;
  viewerRepostRateMax?: number | null;
  viewerRepostRateUnit?: string | null;
  viewerRepostSupplierRateMin?: number | null;
  viewerRepostPricingMode?: string | null;
  viewerRepostMarginValue?: number | null;
  ownerSupplierRateMin?: number | null;
  ownerPricingMode?: string | null;
  ownerMarginValue?: number | null;
}): {
  rateLine: string | null;
  supplierRateLabel: string | null;
  marginLabel: string | null;
} {
  const millRateLine = formatRateLine({
    rate: input.rateMin,
    rateMax: input.rateMax,
    unit: input.rateUnit,
  });

  const applyModeSilent = (opts: {
    mode?: string | null;
    marginValue?: number | null;
    yourRate?: number | null;
    yourRateMax?: number | null;
    rateUnit?: string | null;
    supplierRateMin?: number | null;
    fallbackRateLine: string | null;
  }) => {
    const mode = opts.mode;
    const supplierRateLabel =
      opts.supplierRateMin != null && Number.isFinite(opts.supplierRateMin)
        ? ownerSupplierRateLabel({
            isOwner: true,
            isCuratedPack: true,
            sourceRate: opts.supplierRateMin,
            sourceDisclosed: true,
            catalogRateUnit: opts.rateUnit,
          })
        : null;
    const marginLabel = ownerCuratedMarginLabel({
      pricingMode: mode,
      marginValue: opts.marginValue,
    });
    const your =
      opts.yourRate != null
        ? formatRateLine({
            rate: opts.yourRate,
            rateMax: opts.yourRateMax,
            unit: opts.rateUnit,
          })
        : null;
    if (mode === RepostPricingMode.Edit) {
      return {
        rateLine: your ?? opts.fallbackRateLine,
        supplierRateLabel,
        marginLabel: null,
      };
    }
    if (
      mode === RepostPricingMode.MarginFixed ||
      mode === RepostPricingMode.MarginPercent
    ) {
      return { rateLine: null, supplierRateLabel: null, marginLabel };
    }
    return {
      rateLine: your ?? opts.fallbackRateLine,
      supplierRateLabel,
      marginLabel: null,
    };
  };

  // Supplier card you already reposted — caption from your child stamps.
  if (
    input.viewerReposted &&
    (input.viewerRepostPricingMode != null || input.viewerRepostRateMin != null)
  ) {
    return applyModeSilent({
      mode: input.viewerRepostPricingMode,
      marginValue: input.viewerRepostMarginValue,
      yourRate: input.viewerRepostRateMin,
      yourRateMax: input.viewerRepostRateMax,
      rateUnit: input.viewerRepostRateUnit ?? input.rateUnit,
      supplierRateMin: input.viewerRepostSupplierRateMin,
      fallbackRateLine: millRateLine,
    });
  }

  // Own curated child.
  if (input.isOwn && input.isRepostChild) {
    return applyModeSilent({
      mode: input.ownerPricingMode,
      marginValue: input.ownerMarginValue,
      yourRate: input.rateMin,
      yourRateMax: input.rateMax,
      rateUnit: input.rateUnit,
      supplierRateMin: input.ownerSupplierRateMin,
      fallbackRateLine: millRateLine,
    });
  }

  return { rateLine: millRateLine, supplierRateLabel: null, marginLabel: null };
}
