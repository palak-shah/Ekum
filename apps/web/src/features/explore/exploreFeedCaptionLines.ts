import { formatCatalogRate } from '@/lib/catalogRate';
import { packFeedDetailLine } from '@/ui/albumMosaic';

/** Teal rate line for Explore feed — omit On request / empty. Matches pack header band. */
export function exploreFeedRateLine(input: {
  rate: number | null | undefined;
  rateMax?: number | null;
  unit: string | null | undefined;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
}): string | null {
  if (input.rate == null) return null;
  const formatted = formatCatalogRate({
    rate: input.rate,
    rateMax: input.rateMax,
    unit: input.unit,
    dispatchUnit: input.dispatchUnit,
    catalogRateUnit: input.catalogRateUnit,
  });
  if (!formatted || formatted === 'On request') return null;
  return formatted;
}

export function exploreFeedCategoryLine(tags: string[] | null | undefined): string | null {
  const list = tags ?? [];
  const line = packFeedDetailLine({ tags: list, maxTags: list.length });
  return line || null;
}

/** Trim ends only — keep internal newlines. */
export function exploreFeedAboutText(description: string | null | undefined): string | null {
  const text = description?.trim();
  return text ? text : null;
}

/** Buyer-facing mill credit when the pack opts in (showSourceShops). */
export function exploreFeedSourceLine(names: string[] | null | undefined): string | null {
  const cleaned = (names ?? []).map((name) => name.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return `From ${cleaned[0]}`;
  if (cleaned.length === 2) return `From ${cleaned[0]}, ${cleaned[1]}`;
  return `From ${cleaned.length} shops`;
}

/** Album mill credit: stamped names, else foreign member shops when Show supplier is on. */
export function visitorPackSourceLine(input: {
  showSourceShops: boolean;
  sourceShopNames?: string[] | null;
  packCompanyId: string;
  products: Array<{ companyId?: string | null; companyName?: string | null }>;
}): string | null {
  if (!input.showSourceShops) return null;
  const stamped = exploreFeedSourceLine(input.sourceShopNames);
  if (stamped) return stamped;
  const names = [
    ...new Map(
      input.products
        .filter((row) => row.companyId && row.companyId !== input.packCompanyId)
        .map((row) => [row.companyId!, row.companyName?.trim() ?? ''] as const)
        .filter((entry) => entry[1]),
    ).values(),
  ];
  return exploreFeedSourceLine(names);
}
