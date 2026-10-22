import type { ReactNode } from 'react';
import {
  formatOrderLineBalance,
  OrderLineFactStrip,
  orderLineBalance,
  orderLineFactsWithThisLr,
  type ItemFacts,
} from '@/features/orders/OrderLineFacts';

/** Live leftover / extra after This LR — right of the name, not a strip column. */
export function DispatchLineRemainder({
  item,
  thisLrQty,
  includeThisLr,
}: {
  item: ItemFacts;
  thisLrQty: number;
  includeThisLr: boolean;
}) {
  const preview = orderLineFactsWithThisLr(item, thisLrQty, includeThisLr);
  const balance = orderLineBalance(preview);
  if (!balance || balance.value === 0) return null;
  return (
    <p
      data-testid="order-dispatch-line-remainder"
      aria-label={`After this LR ${formatOrderLineBalance(balance.value)}`}
      className="mt-2.5 mr-2.5 shrink-0 text-[16px] font-emphasis leading-none tabular-nums text-tangerine"
    >
      {formatOrderLineBalance(balance.value)}
    </p>
  );
}

/**
 * Dispatch facts — Ordered · Shipped · This LR (− n +).
 * Signed remainder sits on the name row, not in this strip.
 */
export function DispatchLinePreview({
  item,
  thisLrControl,
}: {
  item: ItemFacts;
  thisLrControl: ReactNode;
}) {
  const ordered = item.quantity;
  const shipped = item.shippedQuantity ?? 0;
  return (
    <OrderLineFactStrip
      editor
      valueBox
      tracks={3}
      density="compact"
      testId="order-dispatch-line-preview"
      ariaLabel="Ordered, shipped, this LR"
      cells={[
        {
          column: 'qty',
          label: 'Ordered',
          value: ordered,
          testId: 'order-dispatch-preview-ordered',
        },
        {
          column: 'ship',
          label: 'Shipped',
          value: shipped,
          testId: 'order-dispatch-preview-shipped',
        },
        {
          column: 'thisLr',
          label: 'This LR',
          value: '',
          control: thisLrControl,
          testId: 'order-dispatch-preview-this-lr',
          nowrap: true,
        },
      ]}
    />
  );
}
