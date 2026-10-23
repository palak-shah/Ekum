import { Unit, isPackOrderUnit } from '@ekum/domain-types';
import { packTagsForMember } from './collectionSameForAll';

export type DesignPackRef = {
  categories?: string[] | null;
  masterCategoryId?: string | null;
};

/** Own tags first, then each collection’s tags (append, no duplicates, cap 20). */
export function designEditorCategories(
  own: readonly string[] | null | undefined,
  packs: readonly DesignPackRef[],
): string[] {
  const fromPacks: string[] = [];
  for (const pack of packs) {
    fromPacks.push(...(pack.categories ?? []));
  }
  return packTagsForMember([...(own ?? [])], fromPacks);
}

/** First pack that already chose a Category — design must not re-pick. */
export function designCategoryLockedByPack(
  packs: readonly DesignPackRef[],
): boolean {
  return packs.some((pack) => Boolean(pack.masterCategoryId?.trim()));
}

/** Pack master category, else the design's own, else the shop's only master category. */
export function designMasterCategoryId(
  packs: readonly DesignPackRef[],
  companyCategoryIds: readonly string[],
  ownMasterCategoryId?: string | null,
): string | null {
  for (const pack of packs) {
    const id = pack.masterCategoryId?.trim();
    if (id) return id;
  }
  const own = ownMasterCategoryId?.trim();
  if (own) return own;
  if (companyCategoryIds.length === 1) return companyCategoryIds[0] ?? null;
  return null;
}

/**
 * Rate per change does not rewrite Dispatch.
 * Pack orders keep the order unit; native path Rate per is the order unit.
 */
export function applyDesignRateUnit(
  orderUnit: string,
  nextRateUnit: string,
  dispatchUnit?: string,
): { unit: string; dispatchUnit: string; catalogRateUnit: string } {
  const order = orderUnit.trim() || Unit.Set;
  const dispatch = dispatchUnit?.trim();
  if (isPackOrderUnit(order)) {
    return {
      unit: order,
      dispatchUnit: dispatch || order,
      catalogRateUnit: nextRateUnit,
    };
  }
  return {
    unit: nextRateUnit,
    dispatchUnit: dispatch || nextRateUnit,
    catalogRateUnit: nextRateUnit,
  };
}
