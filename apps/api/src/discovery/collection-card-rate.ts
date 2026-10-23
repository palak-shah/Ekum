import { RateVisibility, catalogRateUnit } from '@ekum/domain-types';

type RateMember = {
  rate?: { toNumber(): number } | number | null;
  rateMax?: { toNumber(): number } | number | null;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
};

function asNumber(value: { toNumber(): number } | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

function memberRateUnit(product: RateMember): string {
  return (
    catalogRateUnit({
      unit: product.unit,
      dispatchUnit: product.dispatchUnit,
      catalogRateUnit: product.catalogRateUnit,
    }) ??
    product.unit ??
    ''
  );
}

/**
 * Album and Explore pack cards share one gate: the owner always sees the band;
 * other shops follow Show rates (`rateVisibility`).
 */
export function collectionCardRateVisibility(input: {
  rateVisibility: string;
  packCompanyId: string;
  viewerCompanyId?: string | null;
}): string {
  if (input.viewerCompanyId && input.viewerCompanyId === input.packCompanyId) {
    return RateVisibility.Visible;
  }
  return input.rateVisibility;
}

/**
 * Explore / shop / album rate band — only when the pack publishes rates as
 * visible. On request → omit. Collection details rate wins when set (even if
 * designs kept their own rupee). Else min–max from priced members. Mixed member
 * units omit only when there is no pack rate. Pack path unit is Rate per
 * (`catalogRateUnit`), not dispatch.
 */
export function collectionCardRateFields(input: {
  rateVisibility: string;
  rate?: { toNumber(): number } | number | null;
  rateMax?: { toNumber(): number } | number | null;
  catalogRateUnit?: string | null;
  products?: Array<{ product: RateMember }>;
}): { rateMin: number | null; rateMax: number | null; rateUnit: string | null } {
  const empty = { rateMin: null, rateMax: null, rateUnit: null };
  if (input.rateVisibility !== RateVisibility.Visible) return empty;

  const packRate = asNumber(input.rate);
  const packMax = asNumber(input.rateMax);
  const packHigh = packRate != null && packMax != null && packMax > packRate ? packMax : packRate;
  const members = (input.products ?? []).map((entry) => entry.product);
  const agreedUnit = (rows: RateMember[]): string | null => {
    const units = rows.map((p) => memberRateUnit(p)).filter(Boolean);
    if (units.length === 0) return null;
    const unique = new Set(units);
    return unique.size === 1 ? units[0]! : null;
  };

  const priced = members
    .map((product) => {
      const rate = asNumber(product.rate);
      if (rate == null) return null;
      const rateMax = asNumber(product.rateMax);
      return {
        rate,
        high: rateMax != null && rateMax > rate ? rateMax : rate,
        unit: memberRateUnit(product),
      };
    })
    .filter((row): row is { rate: number; high: number; unit: string } => row != null);

  if (packRate != null) {
    const stored = input.catalogRateUnit?.trim();
    return {
      rateMin: packRate,
      rateMax: packHigh != null && packHigh > packRate ? packHigh : null,
      rateUnit: stored || agreedUnit(priced.map((row) => ({ unit: row.unit }))) || agreedUnit(members),
    };
  }

  if (priced.length === 0) return empty;
  const units = new Set(priced.map((row) => row.unit));
  if (units.size > 1) return empty;

  const rateMin = Math.min(...priced.map((row) => row.rate));
  const rateMax = Math.max(...priced.map((row) => row.high));
  return {
    rateMin,
    rateMax: rateMax > rateMin ? rateMax : null,
    rateUnit: priced[0]?.unit || null,
  };
}
