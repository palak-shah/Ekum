/** I-handle trader desk: mill hops are subsets of the buyer ticket. */

export function isTraderSubsetHop(order: {
  buyerCompanyId: string;
  downstreamOrderId: string | null;
}, actorCompanyId: string): boolean {
  return Boolean(order.downstreamOrderId) && order.buyerCompanyId === actorCompanyId;
}

export function traderListHidesSubset(actorCompanyId: string): {
  buyerCompanyId: string;
  downstreamOrderId: { not: null };
} {
  return {
    buyerCompanyId: actorCompanyId,
    downstreamOrderId: { not: null },
  };
}

export function matchParentItemId(
  parentItems: Array<{ id: string; productId: string | null }>,
  millItem: { productId: string | null },
): string | null {
  if (!millItem.productId) return null;
  return parentItems.find((item) => item.productId === millItem.productId)?.id ?? null;
}

export function shouldPassThrough(mill: {
  downstreamOrderId: string | null;
  upstreamReleasedAt: Date | null;
  passHeldAt?: Date | null;
}): boolean {
  return Boolean(mill.downstreamOrderId && mill.upstreamReleasedAt && !mill.passHeldAt);
}

const SUBSET_COMPLETE = new Set([
  'settled',
  'dispatched',
  'delivered',
  'cancelled',
  'declined',
]);

/**
 * Parent (Meena) ticket settles only when every **released** mill subset is done.
 * One settled hop among several → parent stays open (part shipped / pending).
 * Single supplier → that one subset complete ⇒ parent may settle.
 */
export function allReleasedSubsetsComplete(
  subsets: Array<{ upstreamReleasedAt: Date | null; status: string }>,
): boolean {
  const released = subsets.filter((row) => row.upstreamReleasedAt != null);
  if (released.length === 0) return false;
  return released.every((row) => SUBSET_COMPLETE.has(row.status));
}
