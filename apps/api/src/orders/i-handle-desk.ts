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
  millItem: { productId: string | null; sourceItemId?: string | null },
): string | null {
  if (millItem.sourceItemId) {
    const mapped = parentItems.find((item) => item.id === millItem.sourceItemId);
    if (mapped) return mapped.id;
  }
  if (!millItem.productId) return null;
  const hits = parentItems.filter((item) => item.productId === millItem.productId);
  return hits.length === 1 ? hits[0]!.id : null;
}

/** Create-time 1:1 claim: consume the next unused parent line for this mill line. */
export function claimParentItemId(
  unused: Array<{ id: string; productId: string | null; name?: string | null }>,
  millLine: { productId?: string | null; name?: string | null },
): string | null {
  const idx = millLine.productId
    ? unused.findIndex((item) => item.productId === millLine.productId)
    : unused.findIndex(
        (item) =>
          !item.productId &&
          (millLine.name ? item.name === millLine.name : true),
      );
  if (idx < 0) return null;
  const [claimed] = unused.splice(idx, 1);
  return claimed?.id ?? null;
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
