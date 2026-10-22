import type { HowManyFooterSummary } from '@/features/orders/howManyLineMeta';
import { OrderUnitStickyTotal } from '@/features/orders/orderUnitChrome';

/** Qty rows + optional ₹ — money omitted when any counted line has no rate. */
export function OrderQtyFooterSummary({
  summary,
}: {
  summary: HowManyFooterSummary;
}) {
  return <OrderUnitStickyTotal summary={summary} />;
}
