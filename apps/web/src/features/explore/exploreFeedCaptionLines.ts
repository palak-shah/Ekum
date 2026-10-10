import { formatCatalogRate } from '@/lib/catalogRate';
import { packFeedDetailLine } from '@/ui/albumMosaic';

/** Teal rate line for Explore feed — omit On request / empty. Matches pack header band. */
export function exploreFeedRateLine(input: {
  rate: number | null | undefined;
  rateMax?: number | null;
  unit: string | null | undefined;
  dispatchUnit?: string | null;
}): string | null {
  if (input.rate == null) return null;
  const formatted = formatCatalogRate({
    rate: input.rate,
    rateMax: input.rateMax,
    unit: input.unit,
    dispatchUnit: input.dispatchUnit,
  });
  if (!formatted || formatted === 'On request') return null;
  const displayUnit = input.unit;
  if (!displayUnit && !input.dispatchUnit) return formatted;
  return formatted.replace(/\/(?=[^/]+$)/, ' /');
}

export function exploreFeedCategoryLine(tags: string[] | null | undefined): string | null {
  const line = packFeedDetailLine({ tags });
  return line || null;
}

/** Trim ends only — keep internal newlines for feed description clamp. */
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
