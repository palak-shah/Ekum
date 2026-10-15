import {
  SuperCategory,
  SUPER_CATEGORY_LABEL,
  categoryDisplayLabel,
  masterCategoryDisplayLabel,
  masterCategorySlugValues,
  migrateSuperCategoriesToMaster,
} from '@ekum/domain-types';

export type InterestCompany = {
  sellCategories?: string[] | null;
  superCategories?: string[] | null;
  masterCategories?: string[] | null;
};

export type ResolvedInterest = {
  /** Strings used for fine sellCategories hits (buy tags or masters). */
  tags: string[];
  /** Viewer master (or legacy super) slugs for coarse overlap. */
  supers: string[];
  /** True when viewer has fine buyCategories. */
  preferFine: boolean;
};

const SUPER_IDS = new Set<string>(Object.values(SuperCategory));
const MASTER_IDS = new Set<string>(masterCategorySlugValues);
const LABEL_TO_SUPER = new Map(
  (Object.entries(SUPER_CATEGORY_LABEL) as [SuperCategory, string][]).map(([id, label]) => [
    label.toLowerCase(),
    id,
  ]),
);

function companyMasters(company: InterestCompany): string[] {
  const masters = (company.masterCategories ?? []).map((item) => item.trim()).filter(Boolean);
  if (masters.length > 0) return masters;
  return migrateSuperCategoriesToMaster(company.superCategories ?? []);
}

/** Map chip value (super id or human label) to a SuperCategory id when applicable. */
export function resolveSuperCategoryId(category: string): string | null {
  const trimmed = category.trim();
  if (!trimmed) return null;
  if (SUPER_IDS.has(trimmed)) return trimmed;
  if (MASTER_IDS.has(trimmed)) return trimmed;
  return LABEL_TO_SUPER.get(trimmed.toLowerCase()) ?? null;
}

export function resolveInterestFromCompany(viewer: {
  buyCategories?: string[] | null;
  superCategories?: string[] | null;
  masterCategories?: string[] | null;
}): ResolvedInterest {
  const buy = (viewer.buyCategories ?? []).map((item) => item.trim()).filter(Boolean);
  const supers = companyMasters(viewer);
  if (buy.length > 0) {
    return { tags: buy, supers, preferFine: true };
  }
  return { tags: supers, supers, preferFine: false };
}

/**
 * Loose match: fine sell tag hit, or coarse master/super overlap when the viewer is on
 * masters / the publisher has no fine sell tags.
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
  const masters = companyMasters(company);
  return interest.supers.some((id) => masters.includes(id));
}

/** Relevance “Matches …” clause — never dump raw enum keys. */
export function interestHitLabel(hit: string): string {
  if (MASTER_IDS.has(hit)) return masterCategoryDisplayLabel(hit);
  return categoryDisplayLabel(hit);
}
