import { formatUnit } from '@/lib/format';
import { isPackOrderUnit } from '@/lib/catalogRate';
import { howManySoldAs } from '@/features/orders/howManyLineMeta';

/**
 * How they sell — under the name, not glued to the Price box.
 * Set with contents stays “Set · 12 pcs” / “Set · 5 mtrs”; plain units are “per mtr”.
 */
export function orderLineSoldAsCue(
  unit?: string | null,
  piecesPerPack?: number | null,
  dispatchUnit?: string | null,
  catalogRateUnit?: string | null,
): string | null {
  if (isPackOrderUnit(unit)) {
    return howManySoldAs(unit, piecesPerPack, dispatchUnit, catalogRateUnit);
  }
  const label = formatUnit(unit ?? null);
  return label ? `per ${label}` : null;
}

/**
 * Quiet line under the design name — sold-as only.
 * Never repeat SKU/id here: the title is already the name (or the SKU when name was blank).
 */
export function orderLineIdentitySecondary(item: {
  name?: string | null;
  sku?: string | null;
  productId?: string | null;
  unit?: string | null;
  piecesPerPack?: number | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
}): string | null {
  return orderLineSoldAsCue(
    item.unit,
    item.piecesPerPack,
    item.dispatchUnit,
    item.catalogRateUnit,
  );
}
