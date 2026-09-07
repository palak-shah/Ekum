/**
 * Pure timeline steps for an order detail view. Terminal statuses
 * (cancelled / declined) replace the dispatch → deliver tail.
 * Returns append after Delivered when present.
 */

export interface OrderTimelineQuoteItem {
  quantity: number;
  requestedQuantity: number;
  lineStatus: string;
}

export interface OrderTimelineReturn {
  id?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  decidedAt?: string | null;
  resolvedAt?: string | null;
}

export interface OrderTimelineInput {
  status: string;
  createdAt: string;
  confirmedAt: string | null;
  confirmedByName: string | null;
  /** Who locked agreement: buyer accepted quote vs seller confirmed supply. */
  confirmedByRole?: 'buyer' | 'seller' | null;
  deliveredAt: string | null;
  settledAt?: string | null;
  closedAt: string | null;
  updatedAt: string;
  partiallyShipped: boolean;
  dispatch: { dispatchedAt: string | null } | null;
  /** Seller has posted at least one Rate / quote card for this order. */
  hasSellerQuote?: boolean;
  sellerName?: string | null;
  items?: OrderTimelineQuoteItem[];
  returns?: OrderTimelineReturn[];
  staff?: OrderTimelineStaffInput;
}

export interface OrderTimelineStaffInput {
  /** Staff on your team for each step — only set when your company did the action. */
  requested?: string | null;
  quoted?: string | null;
  confirmed?: string | null;
  dispatched?: string | null;
  delivered?: string | null;
}

export interface OrderTimelineStep {
  key: string;
  label: string;
  at: string | null;
  done: boolean;
  current: boolean;
  /** Extra line under the step (e.g. offered vs asked qty). */
  detail?: string | null;
  /** Quiet staff name for your team's action on this step. */
  staffLine?: string | null;
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

function quotedStepLabel(sellerName: string | null | undefined): string {
  const name = sellerName?.trim() || null;
  return name ? `Quoted by ${name}` : 'Quoted';
}

/** Offered-vs-asked / can’t-supply summary for the Quoted timeline step. */
export function quoteTimelineDetail(
  items: OrderTimelineQuoteItem[] | undefined,
): string | null {
  if (!items?.length) return null;

  const declined = items.filter((item) => item.lineStatus === 'declined');
  const lowered = items.filter(
    (item) =>
      item.lineStatus !== 'declined' && item.quantity < item.requestedQuantity,
  );

  const parts: string[] = [];
  if (lowered.length === 1) {
    const line = lowered[0]!;
    parts.push(`Offered ${line.quantity} (asked ${line.requestedQuantity})`);
  } else if (lowered.length > 1) {
    parts.push(`Qty lowered on ${lowered.length} designs`);
  }

  if (declined.length === 1) {
    parts.push("Can't supply 1 design");
  } else if (declined.length > 1) {
    parts.push(`Can't supply ${declined.length} designs`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

const OPEN_RETURN = new Set(['requested', 'approved', 'partially_approved']);

function appendReturnSteps(
  steps: OrderTimelineStep[],
  returns: OrderTimelineReturn[],
): void {
  returns.forEach((ret, index) => {
    const suffix = returns.length > 1 ? ` ${index + 1}` : '';
    const prefix = `return-${ret.id ?? index}`;
    const isLatest = index === 0;
    const isLatestOpen = isLatest && OPEN_RETURN.has(ret.status);

    steps.push({
      key: `${prefix}-requested`,
      label: `Return requested${suffix}`,
      at: ret.createdAt,
      done: true,
      current: ret.status === 'requested' && isLatestOpen,
    });

    if (
      ret.status === 'approved' ||
      ret.status === 'partially_approved' ||
      ret.status === 'declined' ||
      ret.status === 'resolved'
    ) {
      const label =
        ret.status === 'declined'
          ? `Return declined${suffix}`
          : ret.status === 'partially_approved'
            ? `Return partially approved${suffix}`
            : `Return approved${suffix}`;
      steps.push({
        key: `${prefix}-decided`,
        label,
        at: ret.decidedAt ?? ret.updatedAt ?? ret.createdAt,
        done: true,
        current:
          ret.status === 'declined'
            ? isLatest
            : (ret.status === 'approved' || ret.status === 'partially_approved') &&
              isLatestOpen,
      });
    }

    if (ret.status === 'resolved') {
      steps.push({
        key: `${prefix}-resolved`,
        label: `Return resolved${suffix}`,
        at: ret.resolvedAt ?? ret.updatedAt ?? ret.createdAt,
        done: true,
        current: isLatest,
      });
    }
  });
}

function staffLine(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

function optionalStaffLine(name: string | null | undefined): { staffLine?: string } {
  const line = staffLine(name);
  return line ? { staffLine: line } : {};
}

export function buildOrderTimelineSteps(order: OrderTimelineInput): OrderTimelineStep[] {
  const closedAt = order.closedAt ?? order.updatedAt;
  const hasQuote = order.hasSellerQuote === true;
  const quoteIsCurrent = hasQuote && order.status === 'requested';
  const returns = order.returns ?? [];
  const hasReturns = returns.length > 0;
  const staff = order.staff ?? {};

  const steps: OrderTimelineStep[] = [
    {
      key: 'requested',
      label: 'Requested',
      at: order.createdAt,
      done: true,
      current: order.status === 'requested' && !hasQuote,
      ...optionalStaffLine(staff.requested),
    },
  ];

  if (hasQuote) {
    steps.push({
      key: 'quoted',
      label: quotedStepLabel(order.sellerName),
      at: order.updatedAt,
      done: true,
      current: quoteIsCurrent,
      detail: quoteTimelineDetail(order.items),
      ...optionalStaffLine(staff.quoted),
    });
  }

  const hadConfirm =
    Boolean(order.confirmedAt) ||
    order.status === 'confirmed' ||
    order.status === 'part_shipped' ||
    order.status === 'dispatched' ||
    order.status === 'delivered' ||
    order.status === 'settled';

  if (hadConfirm) {
    steps.push({
      key: 'confirmed',
      label: agreementStepLabel(order.confirmedByRole, order.confirmedByName),
      at: order.confirmedAt,
      done: Boolean(order.confirmedAt),
      current: order.status === 'confirmed' && !order.partiallyShipped,
      ...optionalStaffLine(staff.confirmed),
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
    label:
      order.status === 'part_shipped' || order.partiallyShipped ? 'Part shipped' : 'Dispatched',
    at: order.dispatch?.dispatchedAt ?? null,
    done:
      Boolean(order.dispatch?.dispatchedAt) ||
      order.status === 'dispatched' ||
      order.status === 'delivered' ||
      order.status === 'settled',
    current:
      order.status === 'dispatched' ||
      ((order.status === 'part_shipped' || order.partiallyShipped) &&
        order.status !== 'settled'),
    ...optionalStaffLine(staff.dispatched),
  });

  if (order.status === 'settled' || order.settledAt) {
    steps.push({
      key: 'settled',
      label: 'Settled',
      at: order.settledAt ?? null,
      done: true,
      current: order.status === 'settled',
      ...optionalStaffLine(staff.dispatched),
    });
  } else {
    steps.push({
      key: 'delivered',
      label: 'Delivered',
      at: order.deliveredAt,
      done: Boolean(order.deliveredAt),
      current: order.status === 'delivered' && !hasReturns,
      ...optionalStaffLine(staff.delivered),
    });
  }

  if (hasReturns) {
    appendReturnSteps(steps, returns);
  }

  return steps;
}
