import {
  migrateSuperCategoriesToMaster,
  type MasterCategoryView,
} from '@ekum/domain-types';

/** Resolve company deal-in chips to catalog Master Category rows (default pick, not the full list). */
export function resolveCompanyMasterOptions(
  catalog: MasterCategoryView[] | undefined,
  masterCategories: string[] | undefined,
  superCategories: string[] | undefined,
): MasterCategoryView[] {
  const all = catalog ?? [];
  const raw =
    masterCategories && masterCategories.length > 0
      ? masterCategories
      : (superCategories ?? []);
  const slugs = migrateSuperCategoriesToMaster(raw);
  // No deal-in chips → no options (do not fall open to the full catalog).
  if (slugs.length === 0) return [];
  return all.filter((c) => slugs.includes(c.slug as (typeof slugs)[number]));
}

/** Pre-select only when Settings deal-in is exactly one Master Category. */
export function defaultProfileMasterCategoryId(
  catalog: MasterCategoryView[] | undefined,
  masterCategories: string[] | undefined,
  superCategories: string[] | undefined,
): string | null {
  const profile = resolveCompanyMasterOptions(catalog, masterCategories, superCategories);
  return profile.length === 1 ? profile[0].id : null;
}
