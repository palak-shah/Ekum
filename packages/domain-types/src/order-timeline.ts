/**
 * Pure timeline steps for an order detail view. Terminal statuses
 * (cancelled / declined) replace the dispatch → deliver tail.
 */

export interface OrderTimelineInput {
  status: string;
  createdAt: string;
  confirmedAt: string | null;
  confirmedByName: string | null;
  /** Who locked agreement: buyer accepted quote vs seller confirmed supply. */
  confirmedByRole?: 'buyer' | 'seller' | null;
  deliveredAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  partiallyShipped: boolean;
  dispatch: { dispatchedAt: string | null } | null;
}

export interface OrderTimelineStep {
  key: string;
  label: string;
  at: string | null;
  done: boolean;
  current: boolean;
}

/** Timeline / parties verb for the agreement step — buyers never “confirm”. */
export function agreementStepLabel(
  confirmedByRole: 'buyer' | 'seller' | null | undefined,
  confirmedByName: string | null | undefined,
): string {
  const name = confirmedByName?.trim() || null;
  if (confirmedByRole === 'buyer') {
    if (!name) return 'Quote accepted';
    return `Quote accepted by ${name}`;
  }
  if (!name) return 'Confirmed';
  return `Confirmed by ${name}`;
}

export function buildOrderTimelineSteps(order: OrderTimelineInput): OrderTimelineStep[] {
  const closedAt = order.closedAt ?? order.updatedAt;
  const steps: OrderTimelineStep[] = [
    {
      key: 'requested',
      label: 'Requested',
      at: order.createdAt,
      done: true,
      current: order.status === 'requested',
    },
  ];

  const hadConfirm =
    Boolean(order.confirmedAt) ||
    order.status === 'confirmed' ||
    order.status === 'dispatched' ||
    order.status === 'delivered';

  if (hadConfirm) {
    steps.push({
      key: 'confirmed',
      label: agreementStepLabel(order.confirmedByRole, order.confirmedByName),
      at: order.confirmedAt,
      done: Boolean(order.confirmedAt),
      current: order.status === 'confirmed' && !order.partiallyShipped,
    });
  }

  if (order.status === 'cancelled' || order.status === 'declined') {
    steps.push({
      key: order.status,
      label: order.status === 'cancelled' ? 'Cancelled' : 'Declined',
      at: closedAt,
      done: true,
      current: true,
    });
    return steps;
  }

  steps.push({
    key: 'dispatched',
    label: order.partiallyShipped ? 'Part shipped' : 'Dispatched',
    at: order.dispatch?.dispatchedAt ?? null,
    done:
      Boolean(order.dispatch?.dispatchedAt) ||
      order.status === 'dispatched' ||
      order.status === 'delivered',
    current: order.status === 'dispatched' || order.partiallyShipped,
  });
  steps.push({
    key: 'delivered',
    label: 'Delivered',
    at: order.deliveredAt,
    done: Boolean(order.deliveredAt),
    current: order.status === 'delivered',
  });

  return steps;
}
