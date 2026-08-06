import { SuperCategory, SUPER_CATEGORY_LABEL } from '@ekum/domain-types';

export type InterestCompany = {
  sellCategories?: string[] | null;
  superCategories?: string[] | null;
};

export type ResolvedInterest = {
  /** Strings used for fine sellCategories hits (buy tags or supers). */
  tags: string[];
  /** Viewer supers for coarse overlap. */
  supers: string[];
  /** True when viewer has fine buyCategories. */
  preferFine: boolean;
};

const SUPER_IDS = new Set<string>(Object.values(SuperCategory));
const LABEL_TO_SUPER = new Map(
  (Object.entries(SUPER_CATEGORY_LABEL) as [SuperCategory, string][]).map(([id, label]) => [
    label.toLowerCase(),
    id,
  ]),
);

/** Map chip value (super id or human label) to a SuperCategory id when applicable. */
export function resolveSuperCategoryId(category: string): string | null {
  const trimmed = category.trim();
  if (!trimmed) return null;
  if (SUPER_IDS.has(trimmed)) return trimmed;
  return LABEL_TO_SUPER.get(trimmed.toLowerCase()) ?? null;
}

export function resolveInterestFromCompany(viewer: {
  buyCategories?: string[] | null;
  superCategories?: string[] | null;
}): ResolvedInterest {
  const buy = (viewer.buyCategories ?? []).map((item) => item.trim()).filter(Boolean);
  const supers = (viewer.superCategories ?? []).map((item) => item.trim()).filter(Boolean);
  if (buy.length > 0) {
    return { tags: buy, supers, preferFine: true };
  }
  return { tags: supers, supers, preferFine: false };
}

/**
 * Loose match: fine sell tag hit, or coarse super overlap when the viewer is on
 * supers / the publisher has no fine sell tags.
 */
export function matchesCompanyInterest(
  company: InterestCompany,
  interest: ResolvedInterest,
): boolean {
  if (interest.tags.length === 0 && interest.supers.length === 0) return false;
  const sell = company.sellCategories ?? [];
  if (interest.tags.some((tag) => sell.includes(tag))) return true;
  const useCoarse = !interest.preferFine || sell.length === 0;
  if (!useCoarse) return false;
  const supers = company.superCategories ?? [];
  return interest.supers.some((superId) => supers.includes(superId));
}
