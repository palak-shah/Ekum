import type { OrderView } from '@ekum/domain-types';

export type ComplaintAgainstTarget = {
  companyId: string;
  name: string;
  /** Quiet role cue — Trader | Supplier (not Seller/Buyer on card body). */
  role: 'trader' | 'supplier' | 'shop';
  /** Prefer mill lot when complaining about a mill. */
  orderId: string;
};

/**
 * Valid against shops for Complaint from an order.
 * Soft-hide: buyer never gets mill targets when mill desks are absent / names null.
 */
export function complaintAgainstTargets(
  order: OrderView,
  actorCompanyId: string | null | undefined,
): ComplaintAgainstTarget[] {
  if (!actorCompanyId) return [];
  const out: ComplaintAgainstTarget[] = [];
  const push = (row: ComplaintAgainstTarget) => {
    if (out.some((t) => t.companyId === row.companyId)) return;
    if (row.companyId === actorCompanyId) return;
    out.push(row);
  };

  const isBuyer = order.buyerCompanyId === actorCompanyId;
  const isSeller = order.sellerCompanyId === actorCompanyId;
  const desks = order.millDesks ?? [];

  if (isBuyer) {
    push({
      companyId: order.sellerCompanyId,
      name: order.sellerName,
      role: order.tradeMode === 'manage' ? 'trader' : 'shop',
      orderId: order.id,
    });
    for (const desk of desks) {
      const millName = desk.sellerName?.trim();
      if (desk.held || !millName || !desk.sellerCompanyId) continue;
      push({
        companyId: desk.sellerCompanyId,
        name: millName,
        role: 'supplier',
        orderId: desk.upstreamOrderId || order.id,
      });
    }
    return out;
  }

  if (isSeller) {
    push({
      companyId: order.buyerCompanyId,
      name: order.buyerName,
      role: 'shop',
      orderId: order.id,
    });
    for (const desk of desks) {
      const millName = desk.sellerName?.trim();
      if (desk.held || !millName || !desk.sellerCompanyId) continue;
      push({
        companyId: desk.sellerCompanyId,
        name: millName,
        role: 'supplier',
        orderId: desk.upstreamOrderId || order.id,
      });
    }
  }

  return out;
}

export function complaintRoleCue(role: ComplaintAgainstTarget['role']): string {
  if (role === 'trader') return 'Trader';
  if (role === 'supplier') return 'Supplier';
  return '';
}

export type EscalateSupplierHint = {
  /** Attached order id (parent or mill lot). */
  orderId?: string | null;
  /** Design ids from the complaint card when known. */
  productIds?: string[] | null;
};

/**
 * Default mill for trader → supplier escalate.
 * Order lines / designs map to one supplier — prefill that mill; caller may still offer Change.
 */
export function defaultEscalateSupplier(
  order: OrderView,
  actorCompanyId: string | null | undefined,
  hint: EscalateSupplierHint = {},
): ComplaintAgainstTarget | null {
  const mills = complaintAgainstTargets(order, actorCompanyId).filter(
    (t) => t.role === 'supplier',
  );
  if (mills.length === 0) return null;
  if (mills.length === 1) return mills[0]!;

  const attached = hint.orderId?.trim();
  if (attached) {
    const byLot = mills.find((m) => m.orderId === attached);
    if (byLot) return byLot;
  }

  const desks = (order.millDesks ?? []).filter((d) => !d.held && d.sellerName?.trim());
  const productIds = new Set(
    (hint.productIds ?? []).map((id) => id.trim()).filter(Boolean),
  );
  const parentItemIds = new Set(
    (order.items ?? [])
      .filter((item) => !productIds.size || (item.productId && productIds.has(item.productId)))
      .map((item) => item.id),
  );

  const matchingCompanyIds = new Set<string>();
  for (const desk of desks) {
    const ownsItem =
      desk.itemIds.some((id) => parentItemIds.has(id)) ||
      desk.lines.some((line) => parentItemIds.has(line.parentItemId));
    const ownsProduct =
      productIds.size > 0 &&
      (order.items ?? []).some(
        (item) =>
          item.productId &&
          productIds.has(item.productId) &&
          (desk.itemIds.includes(item.id) ||
            desk.lines.some((line) => line.parentItemId === item.id)),
      );
    if (ownsItem || ownsProduct) {
      matchingCompanyIds.add(desk.sellerCompanyId);
    }
  }

  if (matchingCompanyIds.size === 1) {
    const only = [...matchingCompanyIds][0]!;
    return mills.find((m) => m.companyId === only) ?? mills[0]!;
  }

  // Ambiguous multi-mill ticket — still open with first released supplier; Change stays available.
  return mills[0]!;
}

export function escalateSupplierAlternatives(
  order: OrderView,
  actorCompanyId: string | null | undefined,
  currentCompanyId: string,
): ComplaintAgainstTarget[] {
  return complaintAgainstTargets(order, actorCompanyId).filter(
    (t) => t.role === 'supplier' && t.companyId !== currentCompanyId,
  );
}
