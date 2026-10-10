import { formatUnit } from '@/lib/format';
import { howManySoldAs } from '@/features/orders/howManyLineMeta';

/**
 * How they sell — under the name, not glued to the Price box.
 * Set with pcs stays “Set · 12 pcs”; plain units are “per mtr”.
 */
export function orderLineSoldAsCue(
  unit?: string | null,
  piecesPerPack?: number | null,
): string | null {
  const pack = piecesPerPack != null && piecesPerPack > 0 ? piecesPerPack : null;
  if (pack != null) return howManySoldAs(unit, pack);
  const label = formatUnit(unit ?? null);
  return label ? `per ${label}` : null;
}

/** Quiet identity under an order line name — SKU / id · sold-as. */
export function orderLineIdentitySecondary(item: {
  sku?: string | null;
  productId?: string | null;
  unit?: string | null;
  piecesPerPack?: number | null;
}): string | null {
  const bits: string[] = [];
  const sku = item.sku?.trim();
  if (sku) bits.push(sku);
  else {
    const id = item.productId?.trim();
    if (id) bits.push(id.length > 12 ? id.slice(0, 10) + '…' : id);
  }
  const sold = orderLineSoldAsCue(item.unit, item.piecesPerPack);
  if (sold) bits.push(sold);
  return bits.length > 0 ? bits.join(' · ') : null;
}
