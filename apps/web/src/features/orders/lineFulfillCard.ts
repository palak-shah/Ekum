import type { OrderItemView, OrderShipmentView, OrderView } from '@ekum/domain-types';

/** Agreed − dispatched, floored at 0 — used when shipped number changes. */
export function remainingAfterShipped(agreed: number, dispatched: number): number {
  if (!Number.isFinite(agreed) || !Number.isFinite(dispatched)) return 0;
  return Math.max(0, Math.floor(agreed) - Math.floor(dispatched));
}

export function sellerCanFulfillEdit(order: Pick<OrderView, 'direction' | 'status'>): boolean {
  if (order.direction !== 'selling') return false;
  return (
    order.status === 'confirmed' ||
    order.status === 'part_shipped' ||
    order.status === 'dispatched'
  );
}

/** New LR / Ship now — not after the ticket is already complete. */
export function sellerCanNewDispatch(order: Pick<OrderView, 'direction' | 'status'>): boolean {
  if (order.direction !== 'selling') return false;
  return order.status === 'confirmed' || order.status === 'part_shipped';
}

/** Newest shipment that still carries this design (shipments are newest-first). */
export function latestShipmentForLine(
  shipments: OrderShipmentView[] | undefined,
  orderItemId: string,
): OrderShipmentView | null {
  for (const shipment of shipments ?? []) {
    if (shipment.items.some((row) => row.orderItemId === orderItemId && row.quantity > 0)) {
      return shipment;
    }
  }
  return null;
}

export function lineShippedOnShipment(
  shipment: OrderShipmentView,
  orderItemId: string,
): number {
  return shipment.items.find((row) => row.orderItemId === orderItemId)?.quantity ?? 0;
}

export function parseQtyDraft(raw: string, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(Math.floor(n), 1_000_000);
}

export function lineNeedsShipNow(item: OrderItemView): boolean {
  if (item.lineStatus === 'declined') return false;
  return (item.remainingQuantity ?? 0) > 0 || (item.shippedQuantity ?? 0) > 0;
}
