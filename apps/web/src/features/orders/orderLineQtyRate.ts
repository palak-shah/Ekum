import { formatCatalogRate } from '@/lib/catalogRate';

/** Collapsed order line meta: qty, and price only when a rate exists (never “On request”). */
export function orderLineQtyRateLine(
  qty: number,
  rate: number | null | undefined,
  unit: string | null | undefined,
  dispatchUnit?: string | null,
): string {
  if (rate == null) return String(qty);
  return `${qty} × ${formatCatalogRate({ rate, unit, dispatchUnit })}`;
}
