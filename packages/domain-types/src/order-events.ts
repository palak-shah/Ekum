/**
 * Frozen chat events for order/quote cards, plus “what you do next” copy
 * for order detail. Labels stay stable on the message even if live status changes.
 */

export const OrderChatEvent = {
  OrderRequested: 'order_requested',
  RateRequested: 'rate_requested',
  OrderUpdated: 'order_updated',
  QuoteSent: 'quote_sent',
  LinesDecided: 'lines_decided',
  QuoteAccepted: 'quote_accepted',
  OrderDeclined: 'order_declined',
  OrderCancelled: 'order_cancelled',
  OrderDispatched: 'order_dispatched',
  OrderDelivered: 'order_delivered',
} as const;
export type OrderChatEvent = (typeof OrderChatEvent)[keyof typeof OrderChatEvent];

const EVENT_LABELS: Record<string, string> = {
  [OrderChatEvent.OrderRequested]: 'Requested',
  [OrderChatEvent.RateRequested]: 'Inquiry',
  [OrderChatEvent.OrderUpdated]: 'Updated',
  [OrderChatEvent.QuoteSent]: 'Quote',
  [OrderChatEvent.LinesDecided]: 'Updated',
  [OrderChatEvent.QuoteAccepted]: 'Accepted',
  [OrderChatEvent.OrderDeclined]: 'Declined',
  [OrderChatEvent.OrderCancelled]: 'Cancelled',
  [OrderChatEvent.OrderDispatched]: 'Dispatched',
  [OrderChatEvent.OrderDelivered]: 'Delivered',
};

function labelFor(event: string): string {
  return EVENT_LABELS[event] ?? 'Order';
}

/** Short stable trade id for chat cards, e.g. Order #X16Y or Inquiry #X16Y. */
export function shortOrderLabel(id: string, options?: { inquiry?: boolean }): string {
  const tail = id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  const prefix = options?.inquiry ? 'Inquiry' : 'Order';
  return `${prefix} #${tail || id.slice(-4)}`;
}

/**
 * Line-decision action word for chat: Confirmed / Declined / Updated.
 * Omits “declined” language when nothing was declined.
 */
export function linesDecidedEventLabel(
  confirmed?: number | null,
  declined?: number | null,
): string {
  const c = typeof confirmed === 'number' && confirmed > 0 ? confirmed : 0;
  const d = typeof declined === 'number' && declined > 0 ? declined : 0;
  if (c > 0 && d > 0) return 'Updated';
  if (d > 0) return 'Declined';
  if (c > 0) return 'Confirmed';
  return 'Updated';
}

export type OrderChatEventLabelFallback = {
  messageType?: string;
  metadataKind?: string | null;
  confirmedCount?: number | null;
  declinedCount?: number | null;
};

/** Human action label for a frozen chat event (or inferred from legacy metadata). */
export function orderChatEventLabel(
  event: string | null | undefined,
  fallback?: OrderChatEventLabelFallback,
): string {
  const isLines =
    event === OrderChatEvent.LinesDecided ||
    (!event && fallback?.metadataKind === 'order_lines');
  if (isLines) {
    return linesDecidedEventLabel(fallback?.confirmedCount, fallback?.declinedCount);
  }
  if (event) {
    const known = EVENT_LABELS[event];
    if (known) return known;
  }
  if (fallback?.messageType === 'rate') {
    return labelFor(OrderChatEvent.QuoteSent);
  }
  if (fallback?.messageType === 'order_card' || fallback?.messageType === 'system') {
    return labelFor(OrderChatEvent.OrderRequested);
  }
  return 'Order';
}

/** Infer event when older messages lack metadata.event. */
export function inferOrderChatEvent(options: {
  messageType: string;
  metadata?: Record<string, unknown> | null;
}): string {
  const meta = options.metadata ?? {};
  if (typeof meta.event === 'string' && meta.event.trim()) {
    return meta.event;
  }
  if (meta.kind === 'order_lines') {
    return OrderChatEvent.LinesDecided;
  }
  if (options.messageType === 'rate' || meta.quoted === true) {
    return OrderChatEvent.QuoteSent;
  }
  return OrderChatEvent.OrderRequested;
}

export type NextOrderActionInput = {
  status: string;
  direction: 'buying' | 'selling';
  /** Buyer-facing: any open line still has a rate (quote pending accept). */
  hasOpenQuotedLine?: boolean;
  partiallyShipped?: boolean;
  /** inquiry | order — soft rate ask until firmed. */
  intent?: string | null;
  /** Other party’s business name for waiting cues (never seller/buyer). */
  counterpartName?: string | null;
};

function waitingOn(counterpartName: string | null | undefined, clause: string): string {
  const who = counterpartName?.trim() || 'them';
  return `Waiting on ${who} ${clause}`;
}

/** One-line “Next” cue for order detail, from the viewer’s role. */
export function nextOrderAction(order: NextOrderActionInput): string | null {
  const buying = order.direction === 'buying';
  const inquiry = order.intent === 'inquiry';
  const other = order.counterpartName;

  switch (order.status) {
    case 'requested':
      if (buying) {
        if (order.hasOpenQuotedLine) return 'Your move: accept quote';
        return inquiry
          ? waitingOn(other, 'for rates')
          : waitingOn(other, 'for quote or confirmation');
      }
      if (order.hasOpenQuotedLine) return waitingOn(other, 'to accept quote');
      return inquiry
        ? 'Your move: send rates'
        : 'Your move: quote, confirm lines, or decline';
    case 'confirmed':
      if (buying) {
        return order.partiallyShipped
          ? `Part shipped — waiting on ${other?.trim() || 'them'} for the rest`
          : waitingOn(other, 'to dispatch');
      }
      return order.partiallyShipped
        ? 'Your move: dispatch remaining'
        : 'Your move: dispatch shipment';
    case 'dispatched':
      return buying
        ? 'Your move: mark delivered'
        : waitingOn(other, 'to mark delivered');
    case 'delivered':
      return buying ? 'Delivered — raise a return if needed' : 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'declined':
      return 'Declined';
    default:
      return null;
  }
}

export function roleLabel(direction: 'buying' | 'selling' | null | undefined): string | null {
  if (direction === 'buying') return 'You buy';
  if (direction === 'selling') return 'You sell';
  return null;
}

function isRoleWord(label: string | null | undefined): boolean {
  const t = label?.trim();
  return !t || /^(seller|buyer|they)$/i.test(t);
}

/**
 * Viewer-relative chat actor. Never Seller/Buyer — only You or the party name.
 * `partyName` is the sender’s business name when frozen actorLabel is missing/legacy.
 */
export function orderChatActor(options: {
  mine: boolean;
  actorLabel?: string | null;
  partyName?: string | null;
}): string {
  if (options.mine) return 'You';
  if (!isRoleWord(options.actorLabel)) return options.actorLabel!.trim();
  if (!isRoleWord(options.partyName)) return options.partyName!.trim();
  return 'They';
}

/** Line-decision body: `You confirmed 1 · declined 2` (omit zero counts). */
export function linesDecidedHeadline(
  actor: string,
  confirmed?: number | null,
  declined?: number | null,
): string {
  const c = typeof confirmed === 'number' && confirmed > 0 ? confirmed : 0;
  const d = typeof declined === 'number' && declined > 0 ? declined : 0;
  const parts: string[] = [];
  if (c > 0) parts.push(`confirmed ${c}`);
  if (d > 0) parts.push(`declined ${d}`);
  if (parts.length === 0) return `${actor} updated lines`;
  return `${actor} ${parts.join(' · ')}`;
}

/** Plain event body for frozen chat cards (no Order #, no Seller/Buyer). */
export function orderChatEventHeadline(actor: string, event: string): string {
  switch (event) {
    case OrderChatEvent.OrderRequested:
      return `${actor} requested`;
    case OrderChatEvent.RateRequested:
      return `${actor} asked for rates`;
    case OrderChatEvent.OrderUpdated:
      return `${actor} updated`;
    case OrderChatEvent.QuoteSent:
      return `${actor} sent quote`;
    case OrderChatEvent.QuoteAccepted:
      return `${actor} accepted quote`;
    case OrderChatEvent.OrderDeclined:
      return `${actor} declined`;
    case OrderChatEvent.OrderCancelled:
      return `${actor} cancelled`;
    case OrderChatEvent.OrderDispatched:
      return `${actor} dispatched`;
    case OrderChatEvent.OrderDelivered:
      return `${actor} marked delivered`;
    case OrderChatEvent.LinesDecided:
      return `${actor} updated`;
    default:
      return `${actor} · order update`;
  }
}

/** Strip legacy role words / Order # so notes never reintroduce Seller/Buyer. */
export function stripOrderChatBodyNoise(
  body: string,
  actorLabel?: string | null,
): string {
  let text = body
    .replace(/\s*·\s*declined 0\b/gi, '')
    .replace(/\s*·\s*confirmed 0\b/gi, '')
    .replace(/\s*·\s*Order #[A-Za-z0-9]+\b/g, '')
    .replace(/\s+Order #[A-Za-z0-9]+\b/g, '')
    .trim();
  text = text.replace(/^(seller|buyer|they)\b[\s·,]*/i, '').trim();
  if (actorLabel?.trim()) {
    const escaped = actorLabel.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`^${escaped}\\b[\\s·,]*`, 'i'), '').trim();
  }
  return text;
}
