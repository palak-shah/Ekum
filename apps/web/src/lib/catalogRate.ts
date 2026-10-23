import {
  catalogRateUnit,
  defaultRateUnit,
  isPackOrderUnit,
  unitValues,
} from '@ekum/domain-types';
import { formatRate } from '@/lib/format';

export { isPackOrderUnit, defaultRateUnit };

/** Unit the rupee attaches to for display / create labels. */
export function catalogRateDisplayUnit(input: {
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  offeredRateUnits?: readonly string[];
}): string | null {
  return catalogRateUnit({
    unit: input.unit,
    dispatchUnit: input.dispatchUnit,
    catalogRateUnit: input.catalogRateUnit,
    offeredRateUnits: input.offeredRateUnits ?? unitValues,
  });
}

/** Catalog / How many rate — pack path shows ₹/{Rate per}; native path ₹/unit. */
export function formatCatalogRate(input: {
  rate?: number | null;
  rateMax?: number | null;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  offeredRateUnits?: readonly string[];
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
  offeredRateUnits?: readonly string[],
  catalogRateUnitStored?: string | null,
): string {
  if (!isPackOrderUnit(orderUnit)) return 'Rate';
  const d =
    catalogRateDisplayUnit({
      unit: orderUnit,
      dispatchUnit,
      catalogRateUnit: catalogRateUnitStored,
      offeredRateUnits,
    }) ?? defaultRateUnit(offeredRateUnits ?? unitValues);
  return `Rate per ${d}`;
}
