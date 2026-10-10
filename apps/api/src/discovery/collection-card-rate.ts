import { RateVisibility } from '@ekum/domain-types';

type RateMember = {
  rate?: { toNumber(): number } | number | null;
  rateMax?: { toNumber(): number } | number | null;
  unit?: string | null;
};

function asNumber(value: { toNumber(): number } | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

/**
 * Explore / shop / album rate band — only when the pack publishes rates as
 * visible. On request → omit. Prefer saved pack rate; else min–max from priced
 * members (blanks ignored). Mixed units → omit.
 */
export function collectionCardRateFields(input: {
  rateVisibility: string;
  rate?: { toNumber(): number } | number | null;
  rateMax?: { toNumber(): number } | number | null;
  products?: Array<{ product: RateMember }>;
}): { rateMin: number | null; rateMax: number | null; rateUnit: string | null } {
  const empty = { rateMin: null, rateMax: null, rateUnit: null };
  if (input.rateVisibility !== RateVisibility.Visible) return empty;

  const packRate = asNumber(input.rate);
  const members = (input.products ?? []).map((entry) => entry.product);
  const unitFromMembers = (() => {
    const units = members.map((p) => p.unit ?? '').filter(Boolean);
    if (units.length === 0) return null;
    const unique = new Set(units);
    return unique.size === 1 ? units[0]! : units[0]!;
  })();

  if (packRate != null) {
    const packMax = asNumber(input.rateMax);
    return {
      rateMin: packRate,
      rateMax: packMax != null && packMax > packRate ? packMax : null,
      rateUnit: unitFromMembers,
    };
  }

  const priced = members
    .map((product) => {
      const rate = asNumber(product.rate);
      if (rate == null) return null;
      const rateMax = asNumber(product.rateMax);
      return {
        rate,
        high: rateMax != null && rateMax > rate ? rateMax : rate,
        unit: product.unit ?? '',
      };
    })
    .filter((row): row is { rate: number; high: number; unit: string } => row != null);

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
