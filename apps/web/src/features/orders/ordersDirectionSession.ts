export type OrdersDirection = 'all' | 'buying' | 'selling';

const DEFAULT_DIRECTION: OrdersDirection = 'all';

let sessionDirection: OrdersDirection = DEFAULT_DIRECTION;

export function isOrdersAppPath(pathname: string): boolean {
  return pathname === '/orders' || pathname.startsWith('/orders/');
}

export function getOrdersDirection(): OrdersDirection {
  return sessionDirection;
}

export function setOrdersDirection(next: OrdersDirection): void {
  sessionDirection = next;
}

export function resetOrdersDirection(): void {
  sessionDirection = DEFAULT_DIRECTION;
}

/** When leaving the Orders tree, drop Buy/Sell so the next entry is All. */
export function noteOrdersPathChange(pathname: string, wasOrders: boolean): boolean {
  const isOrders = isOrdersAppPath(pathname);
  if (wasOrders && !isOrders) resetOrdersDirection();
  return isOrders;
}

export function tradeMatchesDirection(
  itemDirection: string,
  filter: OrdersDirection,
): boolean {
  if (filter === 'all') return true;
  return itemDirection === filter;
}
