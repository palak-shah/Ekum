/** Mill cannot see a linked hop until Send sets `upstreamReleasedAt`. */
export function isHeldFromSupplier(
  order: {
    sellerCompanyId: string;
    downstreamOrderId: string | null;
    upstreamReleasedAt: Date | string | null;
  },
  actorCompanyId: string,
): boolean {
  return (
    order.sellerCompanyId === actorCompanyId &&
    Boolean(order.downstreamOrderId) &&
    order.upstreamReleasedAt == null
  );
}

/**
 * End buyer must not open a linked You Selling hop (same parties as Manage parent).
 * Load parent before calling; mill hops never match (seller ≠ parent seller).
 */
export function isBuyerHiddenYouHop(
  order: {
    buyerCompanyId: string;
    sellerCompanyId: string;
    downstreamOrderId: string | null;
  },
  parent: { buyerCompanyId: string; sellerCompanyId: string } | null | undefined,
  actorCompanyId: string,
): boolean {
  if (!parent || !order.downstreamOrderId) return false;
  if (order.buyerCompanyId !== actorCompanyId) return false;
  return (
    order.buyerCompanyId === parent.buyerCompanyId &&
    order.sellerCompanyId === parent.sellerCompanyId
  );
}
