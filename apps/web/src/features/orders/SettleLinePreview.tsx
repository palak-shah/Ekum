import type { ReactNode } from 'react';
import {
  formatOrderLineBalance,
  OrderLineFactStrip,
  orderLineBalance,
  type ItemFacts,
} from '@/features/orders/OrderLineFacts';
import { orderLineFactsForSettleRemainder } from '@/features/orders/settleSheet';

/** Live leftover / extra after Final — right of the name, not a strip column. */
export function SettleLineRemainder({
  item,
  finalQty,
}: {
  item: ItemFacts;
  finalQty: number;
}) {
  const preview = orderLineFactsForSettleRemainder(item, finalQty);
  const balance = orderLineBalance(preview);
  if (!balance || balance.value === 0) return null;
  return (
    <p
      data-testid="order-settle-line-remainder"
      aria-label={`After settle ${formatOrderLineBalance(balance.value)}`}
      className="mt-2.5 mr-2.5 shrink-0 text-[16px] font-emphasis leading-none tabular-nums text-tangerine"
    >
      {formatOrderLineBalance(balance.value)}
    </p>
  );
}

/**
 * Settle facts — Ordered · Shipped · Final (compact box).
 * Signed remainder sits on the name row, not in this strip.
 */
export function SettleLinePreview({
  item,
  finalControl,
}: {
  item: ItemFacts;
  finalControl: ReactNode;
}) {
  const ordered = item.quantity;
  const shipped = item.shippedQuantity ?? 0;
  return (
    <OrderLineFactStrip
      editor
      valueBox
      tracks={3}
      density="compact"
      testId="order-settle-line-preview"
      ariaLabel="Ordered, shipped, final"
      cells={[
        {
          column: 'qty',
          label: 'Ordered',
          value: ordered,
          testId: 'order-settle-preview-ordered',
        },
        {
          column: 'ship',
          label: 'Shipped',
          value: shipped,
          testId: 'order-settle-preview-shipped',
        },
        {
          column: 'thisLr',
          label: 'Final',
          value: '',
          control: finalControl,
          testId: 'order-settle-preview-final',
          nowrap: true,
        },
      ]}
    />
  );
}
