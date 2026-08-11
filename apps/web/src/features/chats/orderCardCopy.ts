import {
  OrderChatEvent,
  linesDecidedEventLabel,
  linesDecidedHeadline,
  orderChatActor,
  orderChatEventHeadline,
  orderChatEventLabel,
  stripOrderChatBodyNoise,
  type MessageReference,
  type MessageView,
} from '@ekum/domain-types';

export interface OrderCardCopy {
  /** Top line: Order #3YLK · Confirmed (order id first, never wraps mid-id). */
  title: string;
  /** Action word shown beside the order id. */
  action: string;
  /** Body — You / party name + plain action. No Order #, Seller, or Buyer. */
  headline: string;
  /** Support lines (counts / notes) — never role chips or live status. */
  lines: string[];
}

function metaOf(message: MessageView): Record<string, unknown> | null {
  return message.metadata && typeof message.metadata === 'object'
    ? (message.metadata as Record<string, unknown>)
    : null;
}

function asCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function resolveAction(
  event: string,
  message: MessageView,
  meta: Record<string, unknown> | null,
  ref: MessageReference | null | undefined,
): string {
  if (event === OrderChatEvent.LinesDecided || meta?.kind === 'order_lines') {
    return linesDecidedEventLabel(asCount(meta?.confirmedCount), asCount(meta?.declinedCount));
  }
  return (
    ref?.eventLabel ??
    orderChatEventLabel(event, {
      messageType: message.type,
      metadataKind: typeof meta?.kind === 'string' ? meta.kind : null,
      confirmedCount: asCount(meta?.confirmedCount),
      declinedCount: asCount(meta?.declinedCount),
    })
  );
}

function partyNameFallback(
  message: MessageView,
  ref: MessageReference | null | undefined,
  meta: Record<string, unknown> | null,
  partyName?: string | null,
): string | null {
  if (partyName?.trim()) return partyName.trim();
  const role = typeof meta?.actorRole === 'string' ? meta.actorRole : null;
  if (role === 'buyer' && ref?.buyerName?.trim()) return ref.buyerName.trim();
  if (role === 'seller' && ref?.sellerName?.trim()) return ref.sellerName.trim();
  // For messages from the other side, counterpart is that party.
  if (!message.mine && ref?.counterpartName?.trim()) return ref.counterpartName.trim();
  if (ref?.sellerName?.trim()) return ref.sellerName.trim();
  if (ref?.buyerName?.trim()) return ref.buyerName.trim();
  return null;
}

/**
 * Chat order/quote copy: Order # · Action on top; You/party in the body.
 * Never paints Seller/Buyer, role chips, or live order status.
 */
export function buildOrderCardCopy(
  message: MessageView,
  ref: MessageReference | null | undefined,
  options?: { partyName?: string | null },
): OrderCardCopy {
  const meta = metaOf(message);
  const event =
    ref?.event ??
    (typeof meta?.event === 'string' ? meta.event : null) ??
    (meta?.kind === 'order_lines'
      ? OrderChatEvent.LinesDecided
      : message.type === 'rate'
        ? OrderChatEvent.QuoteSent
        : OrderChatEvent.OrderRequested);
  const action = resolveAction(event, message, meta, ref);
  const orderLabel =
    ref?.orderLabel?.trim() ||
    (typeof meta?.orderLabel === 'string' ? meta.orderLabel.trim() : '') ||
    (ref?.name?.startsWith('Order #') || ref?.name?.startsWith('Inquiry #')
      ? ref.name
      : null) ||
    'Order';
  const frozenActor =
    ref?.actorLabel?.trim() ||
    (typeof meta?.actorLabel === 'string' ? meta.actorLabel.trim() : '') ||
    null;
  const partyName = partyNameFallback(message, ref, meta, options?.partyName);
  const actor = orderChatActor({
    mine: message.mine,
    actorLabel: frozenActor,
    partyName,
  });
  const body = message.body?.trim() || null;
  const isQuote = message.type === 'rate' || event === OrderChatEvent.QuoteSent;

  let headline: string;
  if (isQuote) {
    const total = ref?.totalLabel?.trim();
    headline = total ? `${actor} sent quote · ${total}` : orderChatEventHeadline(actor, event);
  } else if (event === OrderChatEvent.LinesDecided || meta?.kind === 'order_lines') {
    const confirmed = asCount(meta?.confirmedCount);
    const declined = asCount(meta?.declinedCount);
    if (confirmed != null || declined != null) {
      headline = linesDecidedHeadline(actor, confirmed, declined);
    } else if (body) {
      const note = stripOrderChatBodyNoise(body, frozenActor);
      headline = note ? `${actor} ${note}` : orderChatEventHeadline(actor, event);
    } else {
      headline = orderChatEventHeadline(actor, event);
    }
  } else {
    headline = orderChatEventHeadline(actor, event);
  }

  if (event === OrderChatEvent.OrderDispatched && body) {
    const note = stripOrderChatBodyNoise(body, frozenActor);
    if (/\bpart\b/i.test(note)) {
      headline = `${actor} dispatched part`;
      const lr = note.match(/\bLR\b.*$/i)?.[0];
      if (lr) headline = `${headline} · ${lr}`;
    } else if (/\bLR\b/i.test(note)) {
      const lr = note.match(/\bLR\b.*$/i)?.[0];
      if (lr && !headline.includes(lr)) headline = `${headline} · ${lr}`;
    }
  }

  const lines: string[] = [];
  if (ref?.itemCount != null) {
    lines.push(`${ref.itemCount} design${ref.itemCount === 1 ? '' : 's'}`);
  }
  if (body) {
    const note = stripOrderChatBodyNoise(body, frozenActor);
    const looksLikeDefault =
      !note ||
      /^(confirmed|declined|dispatched|requested|cancelled|accepted quote|marked delivered|sent quote|updated lines|updated|asked for rates)\b/i.test(
        note,
      ) ||
      headline.toLowerCase().includes(note.toLowerCase());
    if (!looksLikeDefault && note !== headline) {
      lines.push(note);
    }
  }

  return {
    title: `${orderLabel} · ${action}`,
    action,
    headline,
    lines,
  };
}

/** Inbox one-liner: Order # · Action (or quote total). */
export function orderMessagePreviewCore(message: MessageView): string | null {
  const ref = message.reference;
  if (
    message.type !== 'order_card' &&
    message.type !== 'rate' &&
    !(
      message.type === 'system' &&
      (ref?.kind === 'order' || metaOf(message)?.kind === 'order_lines')
    )
  ) {
    return null;
  }
  const copy = buildOrderCardCopy(message, ref);
  if (message.type === 'rate' || ref?.event === OrderChatEvent.QuoteSent) {
    const total = ref?.totalLabel?.trim();
    return total ? `${copy.title.split(' · ')[0]} · ${total}` : copy.title;
  }
  return copy.title;
}
