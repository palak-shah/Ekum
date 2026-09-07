import type {
  AccessRequestView,
  CollectionViewGrantView,
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
  | 'chat_request'
  | 'collection_view_granted';

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
  collection_view_granted: 48,
  chat_request: 45,
};

interface OrderNeedDraft {
  kind: HomeNeedKind;
  counterpartId: string;
  counterpartName: string;
  orderId: string;
  subtitle: string;
  sortAt: string;
}

function orderNeedDraft(order: OrderView): OrderNeedDraft | null {
  const name = order.counterpart.name;
  const sortAt = order.updatedAt || order.createdAt;
  if (sellerNeedsRate(order)) {
    return {
      kind: 'send_rate',
      counterpartId: order.counterpart.id,
      counterpartName: name,
      orderId: order.id,
      subtitle: `${formatOrderQty(order)} · awaiting your rate`,
      sortAt,
    };
  }
  if (sellerCanConfirm(order)) {
    return {
      kind: 'confirm_order',
      counterpartId: order.counterpart.id,
      counterpartName: name,
      orderId: order.id,
      subtitle: formatOrderQty(order),
      sortAt,
    };
  }
  if (buyerCanAcceptQuote(order)) {
    return {
      kind: 'accept_quote',
      counterpartId: order.counterpart.id,
      counterpartName: name,
      orderId: order.id,
      subtitle: formatOrderQty(order),
      sortAt,
    };
  }
  if (sellerNeedsDispatch(order)) {
    return {
      kind: 'dispatch',
      counterpartId: order.counterpart.id,
      counterpartName: name,
      orderId: order.id,
      subtitle: 'ready to send',
      sortAt,
    };
  }
  if (buyerNeedsDelivery(order)) {
    return {
      kind: 'mark_delivered',
      counterpartId: order.counterpart.id,
      counterpartName: name,
      orderId: order.id,
      subtitle: formatOrderQty(order),
      sortAt,
    };
  }
  return null;
}

/** One row per opposite company + action type; count in title when grouped. */
export function needTitle(kind: HomeNeedKind, count: number, name: string): string {
  if (count === 1) {
    switch (kind) {
      case 'send_rate':
        return `Order from ${name}`;
      case 'confirm_order':
        return `Confirm order · ${name}`;
      case 'accept_quote':
        return `Accept quote · ${name}`;
      case 'dispatch':
        return `Dispatch to ${name}`;
      case 'mark_delivered':
        return `Mark delivered · ${name}`;
      default:
        return name;
    }
  }
  switch (kind) {
    case 'send_rate':
      return `${count} need rate · ${name}`;
    case 'confirm_order':
      return `${count} to confirm · ${name}`;
    case 'accept_quote':
      return `${count} quotes · ${name}`;
    case 'dispatch':
      return `${count} to dispatch · ${name}`;
    case 'mark_delivered':
      return `${count} to mark delivered · ${name}`;
    default:
      return `${count} · ${name}`;
  }
}

function ordersListLink(counterpartName: string): string {
  return `/orders?filter=needs&q=${encodeURIComponent(counterpartName)}`;
}

export function buildHomeNeeds(input: {
  orders: OrderView[];
  returns: ReturnView[];
  accessRequests: AccessRequestView[];
  chatRequests: ThreadSummary[];
  collectionViewGrants?: CollectionViewGrantView[];
}): HomeNeedItem[] {
  const items: HomeNeedItem[] = [];

  const orderGroups = new Map<string, OrderNeedDraft[]>();
  for (const order of input.orders) {
    const draft = orderNeedDraft(order);
    if (!draft) continue;
    const key = `${draft.counterpartId}:${draft.kind}`;
    const list = orderGroups.get(key) ?? [];
    list.push(draft);
    orderGroups.set(key, list);
  }

  for (const group of orderGroups.values()) {
    const newest = [...group].sort(
      (a, b) => Date.parse(b.sortAt) - Date.parse(a.sortAt),
    )[0]!;
    const n = group.length;
    const name = newest.counterpartName;
    items.push({
      id:
        n === 1
          ? `order-${newest.kind}-${newest.orderId}`
          : `order-group-${newest.counterpartId}-${newest.kind}`,
      kind: newest.kind,
      title: needTitle(newest.kind, n, name),
      subtitle: n === 1 ? newest.subtitle : null,
      to: n === 1 ? `/orders/${newest.orderId}` : ordersListLink(name),
      sortAt: newest.sortAt,
    });
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
      to: '/network/requests',
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

  const grants = input.collectionViewGrants ?? [];
  if (grants.length > 0) {
    const newest = [...grants].sort(
      (a, b) => Date.parse(b.grantedAt) - Date.parse(a.grantedAt),
    )[0]!;
    const n = grants.length;
    items.push({
      id: 'collection-view-grants',
      kind: 'collection_view_granted',
      title:
        n === 1
          ? `You can view · ${newest.collectionName}`
          : `You can view ${n} collections`,
      subtitle:
        n === 1
          ? newest.company.name
          : `${newest.collectionName} · ${newest.company.name}`,
      to: n === 1 ? `/collections/${newest.collectionId}` : '/grants',
      sortAt: newest.grantedAt,
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
