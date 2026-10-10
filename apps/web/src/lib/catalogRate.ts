import { formatRate } from '@/lib/format';

/** Order units that sell as a pack (qty in sets/dozens…; rate on dispatch). */
export function isPackOrderUnit(unit: string | null | undefined): boolean {
  const key = unit?.trim();
  return key === 'set' || key === 'dozen' || key === 'box' || key === 'bundle';
}

/** Unit the rupee attaches to for display / create labels. */
export function catalogRateDisplayUnit(input: {
  unit?: string | null;
  dispatchUnit?: string | null;
}): string | null {
  if (isPackOrderUnit(input.unit)) {
    return input.dispatchUnit?.trim() || 'pc';
  }
  return input.unit?.trim() || null;
}

/** Catalog / How many rate — pack path shows ₹/pc (dispatch); native path ₹/unit. */
export function formatCatalogRate(input: {
  rate?: number | null;
  rateMax?: number | null;
  unit?: string | null;
  dispatchUnit?: string | null;
}): string {
  return formatRate(
    input.rate ?? null,
    catalogRateDisplayUnit(input),
    input.rateMax ?? null,
  );
}

/** Create/edit Field label when order unit is a pack. */
export function catalogRateFieldLabel(
  orderUnit: string | null | undefined,
  dispatchUnit?: string | null,
): string {
  if (!isPackOrderUnit(orderUnit)) return 'Rate';
  const d = dispatchUnit?.trim() || 'pc';
  return `Rate per ${d}`;
}
