import type { MessageReference, MessageView } from '@ekum/domain-types';
import {
  catalogOrderGoesToLine,
  catalogShareSenderLabel,
} from '@/features/browse/forwardAttribution';
import { inCardSenderLine } from './messagePreview';
import { buildOrderCardCopy, type OrderCardCopy } from './orderCardCopy';

export type ChatTradeCardKind = 'order' | 'quote' | 'collection' | 'design';

export type ChatTradeCardActionStyle = 'link' | 'primary' | 'solid';

export interface ChatTradeCardAction {
  label: string;
  onClick?: () => void;
  to?: string;
  style: ChatTradeCardActionStyle;
  testId?: string;
  /** Footer row: accent vs quiet (equal size). Default accent. */
  emphasis?: 'accent' | 'quiet';
}

export interface ChatTradeCardModel {
  kind: ChatTradeCardKind;
  /** Slot 2 — main identifier (order id + action, pack name, design name). */
  primary: string;
  /** Slot 3 — who acted / shared; omitted when redundant on outgoing. */
  who: string | null;
  /** Slot 4 — support lines (counts, order goes to, notes). */
  details: string[];
  thumbs: string[];
  thumbOverflow?: number;
  /** Gated catalog teaser — blur thumbs; no PhotoViewer. */
  imagesLocked?: boolean;
  action?: ChatTradeCardAction;
  secondaryAction?: { label: string; onClick?: () => void };
  /** Equal-weight side-by-side CTAs (e.g. Allow | Deny). Prefer over action + secondaryAction. */
  actionRow?: ChatTradeCardAction[];
  /** Caption / ask text under card meta (e.g. Meena’s “Asked to see…”). */
  note?: string;
  noteVoiceUrl?: string | null;
  noteVoiceDurationMs?: number | null;
  createdAt: string;
  mine: boolean;
  /** Compact order pulse — left accent, no thumbs. */
  variant: 'bubble' | 'pulse';
  orderId?: string;
}

export interface TradeCardActions {
  openOrder?: () => void;
  quoteAccept?: () => void;
  loggedAccept?: () => void;
  accepting?: boolean;
  collectionPath?: string;
  productPath?: string;
  onCurate?: () => void;
  curating?: boolean;
  curated?: boolean;
}

/** Strip a leading party name from compact-pulse body copy. */
export function stripLeadingParty(text: string, party: string | null | undefined): string {
  if (!text?.trim()) return '';
  if (!party?.trim()) return text.trim();
  const escaped = party.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.trim().replace(new RegExp(`^${escaped}\\b[\\s·,]*`, 'i'), '').trim();
}

/** Action word(s) after order/inquiry id in primary (`Order #J5NS Requested`). */
function actionFromPrimary(primary: string): string {
  if (primary.includes(' · ')) {
    return primary.split(' · ').slice(1).join(' · ').trim().toLowerCase();
  }
  const match = primary.match(/^(?:Order|Inquiry)\s+#[A-Za-z0-9]+\s+(.+)$/i);
  return (match?.[1] ?? '').trim().toLowerCase();
}

/** True when detail only repeats the action word already in the primary title. */
export function isRedundantActionDetail(detail: string, primary: string): boolean {
  const trimmed = detail.trim();
  if (!trimmed) return true;
  const action = actionFromPrimary(primary);
  if (!action) return false;
  const lower = trimmed.toLowerCase();
  const redundant: Record<string, string[]> = {
    accepted: ['accepted quote', 'accepted'],
    requested: ['requested'],
    declined: ['declined'],
    cancelled: ['cancelled'],
    dispatched: ['dispatched', 'dispatched part'],
    delivered: ['marked delivered'],
    settled: ['settled'],
    returned: ['returned', 'raised a return'],
    quote: ['sent quote'],
    inquiry: ['asked for rates'],
    updated: ['updated', 'updated lines'],
    confirmed: ['confirmed'],
  };
  for (const [key, phrases] of Object.entries(redundant)) {
    if (action.includes(key) && phrases.some((p) => lower === p || lower.startsWith(`${p} ·`))) {
      return true;
    }
  }
  return false;
}

function resolveThumbs(ref: MessageReference | null | undefined): {
  thumbs: string[];
  overflow: number;
} {
  const images =
    ref?.images && ref.images.length > 0
      ? ref.images
      : ref?.image
        ? [ref.image]
        : [];
  const overflow =
    ref?.itemCount != null && images.length
      ? Math.max(0, ref.itemCount - images.length)
      : 0;
  return { thumbs: images.filter(Boolean), overflow };
}

function catalogWhoLine(
  message: MessageView,
  senderLabel: string,
  ref: MessageReference | null | undefined,
): string | null {
  const share = catalogShareSenderLabel({
    mine: message.mine,
    senderLabel,
    ownerCompanyId: ref?.ownerCompanyId,
    senderCompanyId: message.senderCompanyId,
  });
  if (share.endsWith('forwarded')) return share;
  if (message.mine) return inCardSenderLine(message, senderLabel);
  return senderLabel.trim() || null;
}

function orderWhoLine(message: MessageView, senderLabel: string): string | null {
  if (message.mine) {
    return inCardSenderLine(message, senderLabel);
  }
  return senderLabel.trim() || null;
}

function compactOrderDetails(
  copy: OrderCardCopy,
  senderLabel: string,
  primary: string,
): string[] {
  const party = messagePartyFromHeadline(copy.headline, senderLabel);
  const stripped = stripLeadingParty(copy.headline, party ?? senderLabel);
  if (!stripped || isRedundantActionDetail(stripped, primary)) return [...copy.lines];
  if (copy.lines.includes(stripped)) return [...copy.lines];
  return [stripped, ...copy.lines];
}

function messagePartyFromHeadline(headline: string, fallback: string): string | null {
  const match = headline.match(/^(.+?)\s+(?:requested|accepted|declined|cancelled|dispatched|marked|sent|asked|updated|confirmed|settled|returned)/i);
  if (match?.[1]?.trim()) return match[1].trim();
  return fallback.trim() || null;
}

function buildOrderActions(
  input: TradeCardActions & { ref: MessageReference | null | undefined },
): ChatTradeCardAction | undefined {
  const { ref, openOrder, quoteAccept, loggedAccept, accepting } = input;
  if (quoteAccept) {
    return {
      label: accepting ? 'Accepting…' : 'Accept quote',
      onClick: quoteAccept,
      style: 'primary',
      testId: ref?.id ? `accept-quote-${ref.id}` : 'accept-quote',
    };
  }
  if (loggedAccept) {
    return {
      label: accepting ? 'Accepting…' : 'Accept',
      onClick: loggedAccept,
      style: 'primary',
    };
  }
  if (openOrder && ref?.available) {
    return {
      label: ref.intent === 'inquiry' ? 'View inquiry →' : 'View order →',
      onClick: openOrder,
      style: 'link',
    };
  }
  return undefined;
}

export function buildOrderTradeCard(
  message: MessageView,
  ref: MessageReference | null | undefined,
  senderLabel: string,
  compact: boolean,
  actions: TradeCardActions = {},
): ChatTradeCardModel {
  const copy = buildOrderCardCopy(message, ref, { partyName: senderLabel });
  const { thumbs, overflow } = compact ? { thumbs: [], overflow: 0 } : resolveThumbs(ref);
  const kind: ChatTradeCardKind = message.type === 'rate' ? 'quote' : 'order';
  const primary = copy.title;
  const who = orderWhoLine(message, senderLabel);
  let details = compact ? compactOrderDetails(copy, senderLabel, primary) : [...copy.lines];
  if (message.type === 'rate' && ref?.totalLabel?.trim()) {
    const total = ref.totalLabel.trim();
    if (!details.some((line) => line.includes(total))) {
      details = [total, ...details];
    }
  }
  const meta =
    message.metadata && typeof message.metadata === 'object'
      ? (message.metadata as Record<string, unknown>)
      : null;
  const noteVoiceUrl =
    typeof meta?.noteVoiceUrl === 'string' ? meta.noteVoiceUrl : null;
  const noteVoiceDurationMs =
    typeof meta?.noteVoiceDurationMs === 'number' ? meta.noteVoiceDurationMs : null;
  const quoteNote =
    message.type === 'rate' && message.body?.trim() && !/^Quote\b/i.test(message.body.trim())
      ? message.body.trim()
      : undefined;
  // Body note is also pushed into copy.lines — keep it only in `note` (once).
  if (quoteNote) {
    details = details.filter((line) => line.trim() !== quoteNote);
  }
  return {
    kind,
    primary,
    who,
    details,
    thumbs,
    thumbOverflow: overflow,
    action: buildOrderActions({ ...actions, ref }),
    note: quoteNote,
    noteVoiceUrl,
    noteVoiceDurationMs,
    createdAt: message.createdAt,
    mine: message.mine,
    variant: compact ? 'pulse' : 'bubble',
    orderId: ref?.id,
  };
}

export function buildCollectionTradeCard(
  message: MessageView,
  ref: MessageReference | null | undefined,
  senderLabel: string,
  orderGoesTo: string | null,
  actions: TradeCardActions = {},
): ChatTradeCardModel {
  const { thumbs, overflow } = resolveThumbs(ref);
  const primary = ref?.available
    ? (ref.name ?? message.body ?? 'Collection')
    : ref
      ? 'Unavailable'
      : (message.body?.trim() || 'Collection');
  const details: string[] = [];
  if (orderGoesTo) details.push(orderGoesTo);
  if (ref?.itemCount != null) {
    details.push(`${ref.itemCount} design${ref.itemCount === 1 ? '' : 's'}`);
  }
  return {
    kind: 'collection',
    primary,
    who: catalogWhoLine(message, senderLabel, ref),
    details,
    thumbs,
    thumbOverflow: overflow,
    imagesLocked: Boolean(ref?.imagesLocked),
    action: ref?.available
      ? { label: 'View collection →', to: actions.collectionPath, style: 'link' }
      : undefined,
    createdAt: message.createdAt,
    mine: message.mine,
    variant: 'bubble',
  };
}

export function buildDesignTradeCard(
  message: MessageView,
  ref: MessageReference | null | undefined,
  senderLabel: string,
  orderGoesTo: string | null,
  actions: TradeCardActions = {},
): ChatTradeCardModel {
  const { thumbs, overflow } = resolveThumbs(ref);
  const primary = ref?.available
    ? (ref.name ?? message.body ?? 'Design')
    : ref
      ? 'Unavailable'
      : (message.body?.trim() || 'Design');
  const details = orderGoesTo ? [orderGoesTo] : [];
  const secondaryAction =
    !message.mine && ref?.available
      ? actions.curated
        ? { label: 'Saved to my designs' }
        : actions.curating
          ? { label: 'Saving…' }
          : actions.onCurate
            ? { label: 'Save to my designs', onClick: actions.onCurate }
            : undefined
      : undefined;
  return {
    kind: 'design',
    primary,
    who: catalogWhoLine(message, senderLabel, ref),
    details,
    thumbs,
    thumbOverflow: overflow,
    imagesLocked: Boolean(ref?.imagesLocked),
    action: ref?.available
      ? { label: 'View design →', to: actions.productPath, style: 'link' }
      : undefined,
    secondaryAction,
    createdAt: message.createdAt,
    mine: message.mine,
    variant: 'bubble',
  };
}

export function buildChatTradeCard(
  message: MessageView,
  ref: MessageReference | null | undefined,
  senderLabel: string,
  options: {
    compact?: boolean;
    orderGoesTo?: string | null;
    actions?: TradeCardActions;
  } = {},
): ChatTradeCardModel | null {
  const meta =
    message.metadata && typeof message.metadata === 'object'
      ? (message.metadata as Record<string, unknown>)
      : null;
  const isLegacyOrderNotice =
    message.type === 'system' &&
    Boolean(ref?.id) &&
    (ref?.kind === 'order' || meta?.kind === 'order_lines');
  const isOrderLike =
    message.type === 'order_card' || message.type === 'rate' || isLegacyOrderNotice;

  if (isOrderLike) {
    return buildOrderTradeCard(
      message,
      ref,
      senderLabel,
      options.compact ?? false,
      options.actions,
    );
  }
  if (message.type === 'collection_card') {
    return buildCollectionTradeCard(
      message,
      ref,
      senderLabel,
      options.orderGoesTo ?? null,
      options.actions,
    );
  }
  if (message.type === 'product_card') {
    return buildDesignTradeCard(
      message,
      ref,
      senderLabel,
      options.orderGoesTo ?? null,
      options.actions,
    );
  }
  return null;
}

/** Re-export for tests — catalog order-goes-to with share path context. */
export { catalogOrderGoesToLine, catalogShareSenderLabel };
