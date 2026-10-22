export type OrdersListTab = 'selling' | 'buying' | 'others';

const DEFAULT_TAB: OrdersListTab = 'selling';

let sessionTab: OrdersListTab = DEFAULT_TAB;

export function isOrdersAppPath(pathname: string): boolean {
  return pathname === '/orders' || pathname.startsWith('/orders/');
}

export function getOrdersListTab(): OrdersListTab {
  return sessionTab;
}

export function setOrdersListTab(next: OrdersListTab): void {
  sessionTab = next;
}

export function resetOrdersListTab(): void {
  sessionTab = DEFAULT_TAB;
}

/** When leaving the Orders tree, the next entry opens on Selling. */
export function noteOrdersPathChange(pathname: string, wasOrders: boolean): boolean {
  const isOrders = isOrdersAppPath(pathname);
  if (wasOrders && !isOrders) resetOrdersListTab();
  return isOrders;
}

export function orderMatchesListTab(direction: string, tab: OrdersListTab): boolean {
  if (tab === 'others') return false;
  return direction === tab;
}
