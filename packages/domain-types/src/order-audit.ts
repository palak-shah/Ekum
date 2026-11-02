/** Append-only qty edits on one live Order (`OrderAudit`). Not Timeline. */

export const OrderAuditKind = {
  Placed: 'placed',
  Amended: 'amended',
  AmendedRemoved: 'amended_removed',
  Quoted: 'quoted',
  Confirmed: 'confirmed',
  SellerEdit: 'seller_edit',
  MillPass: 'mill_pass',
  CantSupply: 'cant_supply',
  Restored: 'restored',
  Settled: 'settled',
} as const;
export type OrderAuditKind = (typeof OrderAuditKind)[keyof typeof OrderAuditKind];

export function formatAuditQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

export function orderAuditQtySummary(
  kind: string,
  qtyBefore: number | null,
  qtyAfter: number,
  itemName?: string | null,
): string {
  const after = formatAuditQty(qtyAfter);
  if (kind === OrderAuditKind.AmendedRemoved) {
    const qty = formatAuditQty(qtyBefore ?? qtyAfter);
    const name = itemName?.trim();
    return name ? `Buyer removed · ${name} · ${qty}` : `Buyer removed · ${qty}`;
  }
  if (qtyBefore == null) {
    if (kind === OrderAuditKind.Placed) return `Placed · ${after}`;
    if (kind === OrderAuditKind.Amended) return `Amended · ${after}`;
    return `Set qty · ${after}`;
  }
  const before = formatAuditQty(qtyBefore);
  if (qtyBefore === qtyAfter) {
    if (kind === OrderAuditKind.Confirmed) return `Confirmed · ${after}`;
    if (kind === OrderAuditKind.Placed) return `Placed · ${after}`;
  }
  switch (kind) {
    case OrderAuditKind.SellerEdit:
      return `Seller changed qty · ${before} → ${after}`;
    case OrderAuditKind.Amended:
      return `Buyer changed qty · ${before} → ${after}`;
    case OrderAuditKind.Quoted:
      return `Quoted qty · ${before} → ${after}`;
    case OrderAuditKind.Confirmed:
      return `Confirmed qty · ${before} → ${after}`;
    case OrderAuditKind.MillPass:
      return `Mill pass · ${before} → ${after}`;
    case OrderAuditKind.CantSupply:
      return `Can’t supply · ${before} → ${after}`;
    case OrderAuditKind.Restored:
      return `Back on order · ${before} → ${after}`;
    case OrderAuditKind.Settled:
      return `Settled · ${before} → ${after}`;
    default:
      return `Updated qty · ${before} → ${after}`;
  }
}
