import type {
  AccessRequestView,
  ExplorePost,
  OrderView,
  ReturnView,
  ThreadSummary,
} from '@ekum/domain-types';
import {
  buyerCanAcceptQuote,
  buyerNeedsDelivery,
  formatOrderQty,
  matchesNeeds,
  sellerCanConfirm,
  sellerNeedsDispatch,
  sellerNeedsRate,
  sellerNeedsReturnReview,
} from '@/features/orders/orderAttention';

export type HomeNeedKind =
  | 'confirm_order'
  | 'send_rate'
  | 'accept_quote'
  | 'dispatch'
  | 'mark_delivered'
  | 'review_return'
  | 'access_request'
  | 'chat_request';

export interface HomeNeedItem {
  id: string;
  kind: HomeNeedKind;
  title: string;
  subtitle: string | null;
  to: string;
  /** ISO time used for recency sort within urgency bands. */
  sortAt: string;
}

/** Higher = more urgent (shown first within same timestamp). */
const KIND_URGENCY: Record<HomeNeedKind, number> = {
  send_rate: 80,
  confirm_order: 75,
  accept_quote: 70,
  review_return: 65,
  dispatch: 60,
  mark_delivered: 55,
  access_request: 50,
  chat_request: 45,
};

export function buildHomeNeeds(input: {
  orders: OrderView[];
  returns: ReturnView[];
  accessRequests: AccessRequestView[];
  chatRequests: ThreadSummary[];
}): HomeNeedItem[] {
  const items: HomeNeedItem[] = [];

  for (const order of input.orders) {
    const name = order.counterpart.name;
    const sortAt = order.updatedAt || order.createdAt;
    if (sellerNeedsRate(order)) {
      items.push({
        id: `order-rate-${order.id}`,
        kind: 'send_rate',
        title: `Order from ${name}`,
        subtitle: `${formatOrderQty(order)} · awaiting your rate`,
        to: `/orders/${order.id}`,
        sortAt,
      });
    } else if (sellerCanConfirm(order)) {
      items.push({
        id: `order-confirm-${order.id}`,
        kind: 'confirm_order',
        title: `Confirm order · ${name}`,
        subtitle: formatOrderQty(order),
        to: `/orders/${order.id}`,
        sortAt,
      });
    } else if (buyerCanAcceptQuote(order)) {
      items.push({
        id: `order-accept-${order.id}`,
        kind: 'accept_quote',
        title: `Accept quote · ${name}`,
        subtitle: formatOrderQty(order),
        to: `/orders/${order.id}`,
        sortAt,
      });
    } else if (sellerNeedsDispatch(order)) {
      items.push({
        id: `order-dispatch-${order.id}`,
        kind: 'dispatch',
        title: `Dispatch to ${name}`,
        subtitle: 'ready to send',
        to: `/orders/${order.id}`,
        sortAt,
      });
    } else if (buyerNeedsDelivery(order)) {
      items.push({
        id: `order-deliver-${order.id}`,
        kind: 'mark_delivered',
        title: `Mark delivered · ${name}`,
        subtitle: formatOrderQty(order),
        to: `/orders/${order.id}`,
        sortAt,
      });
    }
  }

  const returnsByCounterpart = new Map<string, ReturnView[]>();
  for (const ret of input.returns) {
    if (!sellerNeedsReturnReview(ret)) continue;
    const key = ret.counterpart.id;
    const list = returnsByCounterpart.get(key) ?? [];
    list.push(ret);
    returnsByCounterpart.set(key, list);
  }
  for (const group of returnsByCounterpart.values()) {
    const newest = [...group].sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    )[0]!;
    const name = newest.counterpart.name;
    const qty = group.reduce(
      (sum, ret) =>
        sum + ret.items.reduce((lineSum, item) => lineSum + item.requestedQuantity, 0),
      0,
    );
    const rounded = Number.isInteger(qty) ? String(qty) : qty.toFixed(1);
    const reason = newest.reason;
    const n = group.length;
    items.push({
      id: `return-group-${newest.counterpart.id}`,
      kind: 'review_return',
      title: n === 1 ? `Review return · ${name}` : `${n} returns from ${name}`,
      subtitle: reason ? `${rounded} · ${reason}` : `${rounded} pc`,
      to: `/orders/${newest.orderId}`,
      sortAt: newest.updatedAt || newest.createdAt,
    });
  }

  for (const request of input.accessRequests) {
    items.push({
      id: `access-${request.id}`,
      kind: 'access_request',
      title: `Access request · ${request.company.name}`,
      subtitle: request.company.city || null,
      to: '/buyers',
      sortAt: request.createdAt,
    });
  }

  for (const thread of input.chatRequests) {
    const name = thread.title ?? thread.counterpart?.name ?? 'Chat';
    items.push({
      id: `chat-${thread.id}`,
      kind: 'chat_request',
      title: `Chat request · ${name}`,
      subtitle: thread.lastMessage?.body?.trim() || null,
      to: `/chats/${thread.id}`,
      sortAt: thread.lastMessageAt,
    });
  }

  return items.sort((a, b) => {
    const timeDiff = Date.parse(b.sortAt) - Date.parse(a.sortAt);
    if (timeDiff !== 0) return timeDiff;
    return KIND_URGENCY[b.kind] - KIND_URGENCY[a.kind];
  });
}

/** Chip counts — only work that needs the signed-in company's action. */
export function homeMetrics(input: {
  orders: OrderView[];
  returns: ReturnView[];
  accessCount: number;
  chatCount: number;
}) {
  return {
    orders: input.orders.filter(matchesNeeds).length,
    requests: input.accessCount + input.chatCount,
    returns: input.returns.filter(sellerNeedsReturnReview).length,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Followed market posts from the last 24 hours. */
export function newFollowedPostsToday(posts: ExplorePost[], now = Date.now()): ExplorePost[] {
  const cutoff = now - DAY_MS;
  return posts
    .filter((post) => Date.parse(post.postedAt) >= cutoff)
    .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
}
