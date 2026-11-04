/** I-handle trader desk: mill hops are subsets of the buyer ticket. */

export function isTraderSubsetHop(order: {
  buyerCompanyId: string;
  downstreamOrderId: string | null;
}, actorCompanyId: string): boolean {
  return Boolean(order.downstreamOrderId) && order.buyerCompanyId === actorCompanyId;
}

/**
 * Linked Selling hop for leftover trader-owned lines on a mixed Manage parent.
 * Same buyer + seller as the parent; bilateral; not a mill card.
 */
export function isTraderOwnedFulfilmentHop(
  hop: {
    buyerCompanyId: string;
    sellerCompanyId: string;
    downstreamOrderId: string | null;
  },
  parent: { buyerCompanyId: string; sellerCompanyId: string },
): boolean {
  return (
    Boolean(hop.downstreamOrderId) &&
    hop.buyerCompanyId === parent.buyerCompanyId &&
    hop.sellerCompanyId === parent.sellerCompanyId
  );
}

/** Hop seller is the Manage parent seller — You fulfilment hop, not a mill. */
export function isYouFulfilmentSeller(
  hopSellerCompanyId: string,
  parentSellerCompanyId: string,
): boolean {
  return hopSellerCompanyId === parentSellerCompanyId;
}

/**
 * End buyer must not open a linked You Selling hop — parent is the only buyer ticket.
 * Mill hops never party the end buyer (hop buyer = trader).
 */
export function isBuyerHiddenFulfilmentHop(
  hop: {
    buyerCompanyId: string;
    sellerCompanyId: string;
    downstreamOrderId: string | null;
  },
  parent: { buyerCompanyId: string; sellerCompanyId: string },
  actorCompanyId: string,
): boolean {
  return (
    isTraderOwnedFulfilmentHop(hop, parent) && hop.buyerCompanyId === actorCompanyId
  );
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

/** Parent item ids mill hops already own (`sourceItemId`). */
export function millMappedParentItemIds(
  hops: Array<{ items: Array<{ sourceItemId: string | null }> }>,
): Set<string> {
  const ids = new Set<string>();
  for (const hop of hops) {
    for (const item of hop.items) {
      if (item.sourceItemId) ids.add(item.sourceItemId);
    }
  }
  return ids;
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
 * Held (unreleased) hops alone do not block this helper — callers must also
 * refuse Settled while parent lines are still Open/Confirmed (You hop can
 * finish while a mill is still Waiting).
 */
export function allReleasedSubsetsComplete(
  subsets: Array<{ upstreamReleasedAt: Date | null; status: string }>,
): boolean {
  const released = subsets.filter((row) => row.upstreamReleasedAt != null);
  if (released.length === 0) return false;
  return released.every((row) => SUBSET_COMPLETE.has(row.status));
}

/**
 * Parent must not settle while any shippable line is still Open/Confirmed or
 * short of its ordered qty. Silent-released You hops can complete while mill
 * hops stay held — those mill-mapped parent lines remain Open.
 */
export function parentHasPendingFulfilmentLines(
  items: Array<{ id: string; lineStatus: string; quantity: number }>,
  shippedByItem: Map<string, number>,
): boolean {
  for (const item of items) {
    if (item.lineStatus === 'declined') continue;
    if (item.lineStatus === 'open' || item.lineStatus === 'confirmed') return true;
    const shipped = shippedByItem.get(item.id) ?? 0;
    if (shipped + 1e-9 < item.quantity) return true;
  }
  return false;
}

/** Parent item ids claimed by one hop via `sourceItemId`. */
export function hopMappedParentItemIds(
  hopItems: Array<{ sourceItemId?: string | null }>,
): Set<string> {
  const ids = new Set<string>();
  for (const item of hopItems) {
    if (item.sourceItemId) ids.add(item.sourceItemId);
  }
  return ids;
}

/**
 * Parent shipment belongs wholly to this hop when every line maps into the hop’s
 * parent ids (and there is at least one line). Mill vs You LRs never share a row.
 */
export function isHopAttributableShipment(
  shipmentItems: Array<{ orderItemId: string }>,
  mappedParentIds: Set<string>,
): boolean {
  if (shipmentItems.length === 0 || mappedParentIds.size === 0) return false;
  return shipmentItems.every((line) => mappedParentIds.has(line.orderItemId));
}

/**
 * Map one hop shipment’s lines onto parent item ids via `sourceItemId` match.
 * Drops qty ≤ 0 and unmapped lines.
 */
export function mapHopShipmentItemsToParent(
  hopShipmentItems: Array<{ orderItemId: string; quantity: number }>,
  hopItems: Array<{ id: string; productId: string | null; sourceItemId?: string | null }>,
  parentItems: Array<{ id: string; productId: string | null }>,
): Array<{ orderItemId: string; quantity: number }> {
  const byId = new Map(hopItems.map((item) => [item.id, item]));
  const mapped: Array<{ orderItemId: string; quantity: number }> = [];
  for (const line of hopShipmentItems) {
    if (line.quantity <= 0) continue;
    const hopItem = byId.get(line.orderItemId);
    if (!hopItem) continue;
    const parentItemId = matchParentItemId(parentItems, hopItem);
    if (!parentItemId) continue;
    mapped.push({ orderItemId: parentItemId, quantity: line.quantity });
  }
  return mapped;
}

/**
 * Reduce hop-attributable shipment item qtys so shipped(parentLine) ≤ finalQty.
 * Newest shipments first. Returns updated shipment item rows (zeroes kept for caller delete).
 */
export function trimHopShipmentItemsToFinal(
  shipments: Array<{
    id: string;
    dispatchedAt: Date | string | number;
    items: Array<{ id: string; orderItemId: string; quantity: number }>;
  }>,
  mappedParentIds: Set<string>,
  parentItemId: string,
  finalQty: number,
): Array<{ shipmentItemId: string; quantity: number; delete: boolean }> {
  if (!mappedParentIds.has(parentItemId)) return [];
  const attributable = shipments
    .filter((ship) => isHopAttributableShipment(ship.items, mappedParentIds))
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.dispatchedAt).getTime();
      const tb = new Date(b.dispatchedAt).getTime();
      return tb - ta;
    });
  let shipped = 0;
  for (const ship of attributable) {
    for (const item of ship.items) {
      if (item.orderItemId === parentItemId) shipped += item.quantity;
    }
  }
  let excess = Math.max(0, shipped - Math.max(0, finalQty));
  if (excess <= 0) return [];
  const updates: Array<{ shipmentItemId: string; quantity: number; delete: boolean }> = [];
  for (const ship of attributable) {
    if (excess <= 0) break;
    for (const item of ship.items) {
      if (excess <= 0) break;
      if (item.orderItemId !== parentItemId || item.quantity <= 0) continue;
      const cut = Math.min(item.quantity, excess);
      const next = item.quantity - cut;
      excess -= cut;
      updates.push({
        shipmentItemId: item.id,
        quantity: next,
        delete: next <= 0,
      });
    }
  }
  return updates;
}
