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

export function exploreFeedAboutText(description: string | null | undefined): string | null {
  const text = description?.trim();
  return text ? text : null;
}

/** Meta activity line when a pack resurfaced from new members. */
export function exploreFeedNewDesignsLine(input: {
  count: number | null | undefined;
  isOwn: boolean;
}): string | null {
  const n = input.count ?? 0;
  if (n < 1) return null;
  const noun = n === 1 ? 'design' : 'designs';
  return input.isOwn ? `You added ${n} new ${noun}` : `${n} new ${noun}`;
}

/** Buyer-facing mill credit when the pack opts in (showSourceShops). */
export function exploreFeedSourceLine(names: string[] | null | undefined): string | null {
  const cleaned = (names ?? []).map((name) => name.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return `From ${cleaned[0]}`;
  if (cleaned.length === 2) return `From ${cleaned[0]}, ${cleaned[1]}`;
  return `From ${cleaned.length} shops`;
}
