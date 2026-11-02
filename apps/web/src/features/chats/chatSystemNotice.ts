import {
  ORDER_LIFECYCLE_KIND,
  ORDER_NOTE_KIND,
  isOrderLifecycleMetadata,
  isOrderNoteMetadata,
  orderChatActor,
  orderLifecycleTagCopy,
  orderReplyQuoteLabel,
  type MessageReplyPreview,
  type MessageView,
  type OrderLifecycleQtyChange,
} from '@ekum/domain-types';

/** Shared pill chrome for leave notices and date chips. */
export const CHAT_SYSTEM_PILL_CLASS =
  'max-w-[90%] rounded-full bg-surface px-3 py-1 text-center text-[12px] font-body text-muted';

function metaOf(message: { metadata?: unknown }): Record<string, unknown> | null {
  return message.metadata && typeof message.metadata === 'object'
    ? (message.metadata as Record<string, unknown>)
    : null;
}

function asCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function qtyFromMeta(meta: Record<string, unknown>): OrderLifecycleQtyChange | null {
  const raw = meta.qtyChange;
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  return {
    count: typeof row.count === 'number' ? row.count : 0,
    name: typeof row.name === 'string' ? row.name : null,
    before: typeof row.before === 'number' ? row.before : null,
    after: typeof row.after === 'number' ? row.after : null,
    unit: typeof row.unit === 'string' ? row.unit : null,
  };
}

export function isOrderLifecycleNotice(message: {
  type: string;
  metadata?: unknown;
}): boolean {
  if (message.type !== 'system') return false;
  return isOrderLifecycleMetadata(metaOf(message));
}

/** Later order pulses: actor-side tagged bubble, not a centered pill. */
export function isOrderTaggedUpdate(message: {
  type: string;
  metadata?: unknown;
}): boolean {
  if (message.type !== 'system') return false;
  const meta = metaOf(message);
  const kind = typeof meta?.kind === 'string' ? meta.kind : '';
  return kind === ORDER_LIFECYCLE_KIND || kind === ORDER_NOTE_KIND;
}

/**
 * Plain leave / roster system lines (not order cards, pack asks, or order tags).
 * Rendered as a centered WhatsApp-style notice, not a chat bubble.
 */
export function isChatSystemNotice(message: {
  type: string;
  metadata?: unknown;
  referenceId?: string | null;
}): boolean {
  if (message.type !== 'system') return false;
  const meta = metaOf(message);
  if (isOrderTaggedUpdate(message)) return false;
  if (message.referenceId) return false;
  if (!meta) return true;
  if (meta.kind === 'member_left' || meta.kind === 'company_left') return true;
  if (meta.kind === 'collection_view_request' || meta.kind === 'relist_request') return false;
  if (meta.kind === 'order_lines' || meta.kind === 'order') return false;
  if (meta.side === 'company') return false;
  return !meta.kind;
}

/** Viewer-relative tag copy: You confirmed / {shop} confirmed. */
export function orderTaggedUpdateText(message: MessageView): string | null {
  const lifecycle = orderLifecycleNoticeText(message);
  if (lifecycle) return lifecycle;
  if (!isOrderNoteMetadata(metaOf(message))) return null;
  const meta = metaOf(message);
  const actor = orderChatActor({
    mine: message.mine,
    actorLabel: typeof meta?.actorLabel === 'string' ? meta.actorLabel : null,
    partyName: message.reference?.counterpartName ?? null,
  });
  return `${actor} added a note`;
}

export function orderTagQuotePreview(message: MessageView): MessageReplyPreview | null {
  if (!isOrderTaggedUpdate(message)) return null;
  if (message.replyTo) {
    const label =
      orderReplyQuoteLabel({
        kind: message.replyTo.type === 'rate' ? 'rate' : 'order',
        name: message.replyTo.bodyPreview,
        orderLabel: message.reference?.orderLabel ?? message.replyTo.bodyPreview,
      }) ??
      message.replyTo.bodyPreview ??
      'Order';
    return { ...message.replyTo, bodyPreview: label };
  }
  const livingId = orderLifecycleLivingMessageId(message);
  const ref = message.reference;
  return {
    id: livingId ?? message.id,
    type: 'order_card',
    bodyPreview: orderReplyQuoteLabel(ref) ?? ref?.orderLabel ?? ref?.name ?? 'Order',
    available: true,
    photoUrl: ref?.image ?? null,
  };
}

export function orderLifecycleNoticeText(message: MessageView): string | null {
  if (!isOrderLifecycleNotice(message)) return null;
  const meta = metaOf(message);
  const actor = orderChatActor({
    mine: message.mine,
    actorLabel: typeof meta?.actorLabel === 'string' ? meta.actorLabel : null,
    partyName: message.reference?.counterpartName ?? null,
  });
  return orderLifecycleTagCopy({
    event: typeof meta?.event === 'string' ? meta.event : '',
    actor,
    confirmedCount: asCount(meta?.confirmedCount),
    declinedCount: asCount(meta?.declinedCount),
    partial: meta?.partial === true,
    lrNumber: typeof meta?.lrNumber === 'string' ? meta.lrNumber : null,
    quoteUpdated: meta?.quoteUpdated === true,
    qtyChange: meta ? qtyFromMeta(meta) : null,
    amendSummary: typeof meta?.amendSummary === 'string' ? meta.amendSummary : null,
  });
}

export function orderLifecycleLivingMessageId(message: MessageView): string | null {
  const meta = metaOf(message);
  return typeof meta?.livingMessageId === 'string' && meta.livingMessageId.trim()
    ? meta.livingMessageId.trim()
    : null;
}

export function orderLifecycleOrderId(message: MessageView): string | null {
  const meta = metaOf(message);
  if (typeof meta?.orderId === 'string' && meta.orderId.trim()) return meta.orderId.trim();
  return message.reference?.id ?? null;
}
