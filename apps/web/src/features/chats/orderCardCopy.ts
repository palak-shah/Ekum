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
  /** Header: Order #3YLK Requested (order id first, never wraps mid-id). */
  title: string;
  /** Action word shown beside the order id. */
  action: string;
  /** Body — You / party name + plain action. No Order #, Seller, or Buyer. */
  headline: string;
  /** Header support (counts / catalog / can’t-supply) — never mill-lot hashes. */
  lines: string[];
  /** Parent cue + Place/Send body — under thumbs, not in the header. */
  note: string | null;
}

function metaOf(message: MessageView): Record<string, unknown> | null {
  return message.metadata && typeof message.metadata === 'object'
    ? (message.metadata as Record<string, unknown>)
    : null;
}

function asCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function resolveEvent(
  message: MessageView,
  ref: MessageReference | null | undefined,
): string {
  const meta = metaOf(message);
  return (
    ref?.event ??
    (typeof meta?.event === 'string' ? meta.event : null) ??
    (meta?.kind === 'order_lines'
      ? OrderChatEvent.LinesDecided
      : message.type === 'rate'
        ? OrderChatEvent.QuoteSent
        : OrderChatEvent.OrderRequested)
  );
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
  if (
    event === OrderChatEvent.OrderDispatched &&
    (meta?.partial === true || /\bpart\b/i.test(message.body ?? ''))
  ) {
    return 'Part dispatched';
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

/** Living order/rate cards stay rich; lifecycle pulses are centered tags, not compact chips. */
export function isRichOrderChatMessage(
  message: MessageView,
  _ref?: MessageReference | null,
): boolean {
  return message.type === 'order_card' || message.type === 'rate';
}

/** Newest living trade card for an order (legacy stacks: last in chrono). */
export function livingOrderCardId(
  messages: MessageView[],
  orderId: string,
): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]!;
    if (message.type !== 'order_card' && message.type !== 'rate') continue;
    if (message.reference?.id === orderId) return message.id;
  }
  return null;
}

/**
 * Hide legacy duplicate order/rate cards for the same order — keep the newest.
 * `messages` should be chronological (oldest → newest), as rendered in the thread.
 */
/** Newest incoming rate card that can still be accepted — only that one gets the primary CTA. */
/**
 * Newest order card per ticket that the buyer can still Decline.
 * One Decline per order — later pulses of the same ticket do not repeat it.
 */
export function declineOrderMessageIds(messages: MessageView[]): Set<string> {
  const best = new Map<string, { id: string; at: number }>();
  for (const message of messages) {
    if (message.type !== 'order_card') continue;
    const ref = message.reference;
    if (!ref?.canDeclineOrder || !ref.available || !ref.id) continue;
    const at = Date.parse(message.createdAt);
    if (!Number.isFinite(at)) continue;
    const prev = best.get(ref.id);
    if (!prev || at > prev.at) best.set(ref.id, { id: message.id, at });
  }
  return new Set([...best.values()].map((row) => row.id));
}

export function primaryAcceptQuoteMessageId(messages: MessageView[]): string | null {
  let best: { id: string; at: number } | null = null;
  for (const message of messages) {
    if (message.type !== 'rate' || message.mine) continue;
    const ref = message.reference;
    if (!ref?.canAcceptQuote || !ref.available || !ref.id) continue;
    const at = Date.parse(message.createdAt);
    if (!Number.isFinite(at)) continue;
    if (!best || at > best.at) {
      best = { id: message.id, at };
    }
  }
  return best?.id ?? null;
}

export function dedupeOrderThreadMessages(messages: MessageView[]): MessageView[] {
  const latestIndex = new Map<string, number>();
  messages.forEach((message, index) => {
    const refId = message.reference?.id;
    if ((message.type === 'order_card' || message.type === 'rate') && refId) {
      latestIndex.set(refId, index);
    }
  });
  return messages.filter((message, index) => {
    const refId = message.reference?.id;
    if ((message.type !== 'order_card' && message.type !== 'rate') || !refId) {
      return true;
    }
    return latestIndex.get(refId) === index;
  });
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
 * Chat order/quote copy: Order # Action on top; You/party in the body.
 * Never paints Seller/Buyer, role chips, or live order status.
 */
export function buildOrderCardCopy(
  message: MessageView,
  ref: MessageReference | null | undefined,
  options?: { partyName?: string | null },
): OrderCardCopy {
  const meta = metaOf(message);
  const event = resolveEvent(message, ref);
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
  const parentLabel =
    typeof meta?.parentOrderLabel === 'string' ? meta.parentOrderLabel.trim() : '';
  if (ref?.itemCount != null) {
    // Quote cards: itemCount is this send (quoted + newly declined), not order total.
    const declined = asCount(meta?.declinedCount) ?? 0;
    if (isQuote && declined > 0) {
      const quoted = Math.max(0, ref.itemCount - declined);
      lines.push(
        quoted > 0
          ? `${quoted} quoted · ${declined} can’t supply`
          : `${declined} can’t supply`,
      );
    } else {
      const catalogCount =
        asCount(ref.catalogCount) ?? asCount(meta?.catalogCount);
      const catalogName = (
        (typeof ref.catalogName === 'string' && ref.catalogName) ||
        (typeof meta?.catalogName === 'string' ? meta.catalogName : '')
      ).trim();
      if (catalogName && ref.itemCount === 1 && catalogCount === 1) {
        lines.push(catalogName);
      } else if (catalogCount != null && catalogCount === ref.itemCount && catalogCount > 0) {
        lines.push(`${catalogCount} catalog${catalogCount === 1 ? '' : 's'}`);
      } else {
        lines.push(`${ref.itemCount} design${ref.itemCount === 1 ? '' : 's'}`);
      }
    }
  }
  const noteParts: string[] = [];
  if (parentLabel) {
    noteParts.push(`Part of ${parentLabel}`);
  }
  if (body) {
    const note = stripOrderChatBodyNoise(body, frozenActor);
    const looksLikeDefault =
      !note ||
      /logged an order/i.test(note) ||
      /^(confirmed|declined|dispatched|requested|cancelled|accepted quote|marked delivered|sent quote|updated lines|updated|asked for rates|settled|returned|raised a return)\b/i.test(
        note,
      ) ||
      headline.toLowerCase().includes(note.toLowerCase());
    if (!looksLikeDefault && note !== headline) {
      noteParts.push(note);
    }
  }

  return {
    title: `${orderLabel} ${action}`,
    action,
    headline,
    lines,
    note: noteParts.join('\n') || null,
  };
}

/** Living-card sentence when a supplier or trader logged the ticket for the buyer. */
export function orderPlacedByLine(
  message: MessageView,
  ref: MessageReference | null | undefined,
  options?: { partyName?: string | null },
): string | null {
  if (!ref?.loggedForBuyer) return null;
  if (message.mine) return 'You placed this order.';
  const meta = metaOf(message);
  const frozenActor =
    ref.actorLabel?.trim() ||
    (typeof meta?.actorLabel === 'string' ? meta.actorLabel.trim() : '') ||
    null;
  const partyName = partyNameFallback(message, ref, meta, options?.partyName);
  const actor = orderChatActor({
    mine: false,
    actorLabel: frozenActor,
    partyName,
  });
  return `Order placed by ${actor}.`;
}

/** Inbox one-liner: Order # Action (or quote total). */
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
    if (!total) return copy.title;
    const escaped = copy.action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const orderLabel = copy.title.replace(new RegExp(`\\s+${escaped}$`), '').trim() || copy.title;
    return `${orderLabel} · ${total}`;
  }
  return copy.title;
}
