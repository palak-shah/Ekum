import type { OrdersListTab } from './ordersDirectionSession';

export type OrdersStatusFilter = 'pending' | 'completed';

export const ORDERS_LIST_TAB_DEFAULT: OrdersListTab = 'selling';
export const ORDERS_STATUS_DEFAULT: OrdersStatusFilter = 'pending';

const LIST_TAB_ORDER: OrdersListTab[] = ['selling', 'buying', 'others'];

/**
 * No explicit direction intent: first tab with rows (Selling → Buying → Others).
 * Everything empty → established default (Selling).
 */
export function firstOrdersListTabWithContent(
  counts: Record<OrdersListTab, number>,
): OrdersListTab {
  for (const tab of LIST_TAB_ORDER) {
    if (counts[tab] > 0) return tab;
  }
  return ORDERS_LIST_TAB_DEFAULT;
}

/**
 * No explicit status intent: first chip with rows (Pending → Completed).
 * Everything empty → established default (Pending).
 */
export function firstOrdersStatusWithContent(
  pendingCount: number,
  completedCount: number,
): OrdersStatusFilter {
  if (pendingCount > 0) return 'pending';
  if (completedCount > 0) return 'completed';
  return ORDERS_STATUS_DEFAULT;
}
