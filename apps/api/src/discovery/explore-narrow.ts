import { exploreNarrowFromQuery } from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';
import { resolveSuperCategoryId } from './interest-match';

export function narrowLists(query: {
  category?: string;
  city?: string;
  categories?: string[];
  cities?: string[];
}): { categories: string[]; cities: string[] } {
  return exploreNarrowFromQuery(query);
}

export function interestFromNarrowCategories(categories: string[]): {
  tags: string[];
  supers: string[];
  preferFine: boolean;
} | null {
  if (categories.length === 0) return null;
  const supers = [
    ...new Set(
      categories
        .map((item) => resolveSuperCategoryId(item))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  return {
    tags: categories,
    supers,
    preferFine: categories.some((item) => !resolveSuperCategoryId(item)),
  };
}

export function cityEqualsWhere(cities: string[]): Prisma.CompanyWhereInput {
  if (cities.length === 0) return {};
  if (cities.length === 1) return { city: cities[0] };
  return { city: { in: cities } };
}

export function categoryHasSomeWhere(
  categories: string[],
  field: 'buyCategories' | 'sellCategories',
): Prisma.CompanyWhereInput {
  if (categories.length === 0) return {};
  const supers = [
    ...new Set(
      categories
        .map((item) => resolveSuperCategoryId(item))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const or: Prisma.CompanyWhereInput[] = [{ [field]: { hasSome: categories } }];
  if (supers.length > 0) {
    or.push({ superCategories: { hasSome: supers } });
  }
  return or.length === 1 ? or[0]! : { OR: or };
}
