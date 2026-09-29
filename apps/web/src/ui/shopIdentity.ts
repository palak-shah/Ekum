import { categoryDisplayLabel } from '@ekum/domain-types';

/** Sell tags from a public shop card or profile. */
export function shopSellCategories(company: {
  id?: string;
  sellCategories?: string[] | null;
  categories?: string[] | null;
}): string[] {
  if (company.sellCategories && company.sellCategories.length > 0) {
    return company.sellCategories;
  }
  if (company.categories && company.categories.length > 0) {
    return company.categories;
  }
  return [];
}

/**
 * Under the shop name: `Surat · Fabric, Dress material`.
 * City only when there are no categories.
 */
export function shopIdentityLine(
  city: string | null | undefined,
  categories: readonly string[] | undefined,
  maxCats = 2,
): string {
  const place = city?.trim() ?? '';
  const cats = (categories ?? [])
    .map((value) => categoryDisplayLabel(value))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, maxCats);
  if (place && cats.length > 0) return `${place} · ${cats.join(', ')}`;
  return place || cats.join(', ');
}
