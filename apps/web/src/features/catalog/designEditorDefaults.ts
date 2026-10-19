import { Unit, isPackOrderUnit } from '@ekum/domain-types';

export type DesignPackRef = {
  categories?: string[] | null;
  masterCategoryId?: string | null;
};

/** Collection tags, in pack order, when the design has none of its own. */
export function designEditorCategories(
  own: readonly string[] | null | undefined,
  packs: readonly DesignPackRef[],
): string[] {
  const mine = (own ?? []).map((tag) => tag.trim()).filter(Boolean);
  if (mine.length > 0) return mine;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const pack of packs) {
    for (const raw of pack.categories ?? []) {
      const label = raw.trim();
      const key = label.toLowerCase();
      if (!label || seen.has(key)) continue;
      seen.add(key);
      out.push(label);
      if (out.length >= 20) return out;
    }
  }
  return out;
}

/** Pack master category, else the shop's only master category. */
export function designMasterCategoryId(
  packs: readonly DesignPackRef[],
  companyCategoryIds: readonly string[],
): string | null {
  for (const pack of packs) {
    const id = pack.masterCategoryId?.trim();
    if (id) return id;
  }
  if (companyCategoryIds.length === 1) return companyCategoryIds[0] ?? null;
  return null;
}

/**
 * Rate per change, same as collection: pack orders keep the order unit.
 * pc (or the order unit itself) does not write pc onto dispatch.
 */
export function applyDesignRateUnit(
  orderUnit: string,
  nextRateUnit: string,
): { unit: string; dispatchUnit: string } {
  const order = orderUnit.trim() || Unit.Set;
  if (isPackOrderUnit(order)) {
    if (nextRateUnit === Unit.Piece || nextRateUnit === order) {
      return { unit: order, dispatchUnit: order };
    }
    return { unit: order, dispatchUnit: nextRateUnit };
  }
  return { unit: nextRateUnit, dispatchUnit: nextRateUnit };
}
