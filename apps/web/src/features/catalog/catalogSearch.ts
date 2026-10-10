import { formatRate } from '@/lib/format';

/** Strip ₹ and grouping commas so “₹1,200” matches “1200”. */
export function catalogSearchPriceKey(text: string): string {
  return text.replace(/₹/g, '').replace(/,/g, '').replace(/\s+/g, ' ').trim();
}

/** In-page find on You / shop / Saved / album — keep the list until they type. */
export function catalogSearchMatches(
  query: string,
  ...parts: Array<string | number | null | undefined | readonly string[]>
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const hay = parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .map((part) => (typeof part === 'number' ? String(part) : part))
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .toLowerCase();
  if (hay.includes(needle)) return true;
  const priceNeedle = catalogSearchPriceKey(needle);
  if (!priceNeedle || priceNeedle === needle) return false;
  return catalogSearchPriceKey(hay).includes(priceNeedle);
}

/** Tokens so Find matches ₹128, 1,200, 128/mtr, and raw 128. */
export function designRateFindTokens(
  rate: number | null | undefined,
  rateMax: number | null | undefined,
  unit: string | null | undefined,
): string[] {
  if (rate == null) return [];
  const unitKey = unit?.trim() || null;
  const low = String(rate);
  const lowIn = rate.toLocaleString('en-IN');
  const high =
    rateMax != null && rateMax > rate
      ? { plain: String(rateMax), in: rateMax.toLocaleString('en-IN') }
      : null;
  const tokens = [
    formatRate(rate, unitKey, rateMax ?? null),
    low,
    lowIn,
    unitKey ? `${low}/${unitKey}` : null,
    unitKey ? `${low} /${unitKey}` : null,
    unitKey ? `${lowIn}/${unitKey}` : null,
    high?.plain ?? null,
    high?.in ?? null,
  ];
  return tokens.filter((token): token is string => Boolean(token?.trim()));
}

export type DesignFindRow = {
  name?: string | null;
  sku?: string | null;
  description?: string | null;
  categories?: readonly string[] | null;
  companyName?: string | null;
  unit?: string | null;
  rate?: number | null;
  rateMax?: number | null;
  moq?: number | null;
};

/** True when a design tag matches the typed Find query. */
export function designTagMatchesQuery(
  query: string,
  categories?: readonly string[] | null,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const tags = (categories ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  return tags.some((tag) => tag.includes(needle) || needle.includes(tag));
}

/** True when the design’s rate matches the typed price (exact, band, or chip text). */
export function designRateMatchesQuery(
  query: string,
  rate: number | null | undefined,
  rateMax: number | null | undefined,
  unit: string | null | undefined,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (rate == null) return false;
  const tokens = designRateFindTokens(rate, rateMax, unit).join(' ').toLowerCase();
  if (tokens.includes(needle)) return true;
  const priceNeedle = catalogSearchPriceKey(needle);
  if (priceNeedle && catalogSearchPriceKey(tokens).includes(priceNeedle)) return true;

  const numeric = Number(priceNeedle.replace(/\/.*$/, '').trim());
  if (!Number.isFinite(numeric)) return false;
  if (rate === numeric || rateMax === numeric) return true;
  if (rateMax != null && rateMax > rate && numeric >= rate && numeric <= rateMax) {
    return true;
  }
  return false;
}

/**
 * Album / library Find: tags and rates first, then name · SKU · notes · shop.
 * Keeps results to designs in the current list that actually match.
 */
export function designMatchesFind(query: string, row: DesignFindRow): boolean {
  const needle = query.trim();
  if (!needle) return true;
  if (designTagMatchesQuery(needle, row.categories)) return true;
  if (designRateMatchesQuery(needle, row.rate, row.rateMax, row.unit)) return true;
  return catalogSearchMatches(
    needle,
    row.name,
    row.sku,
    row.description,
    row.companyName,
    row.unit,
    row.moq,
  );
}

/** Design / album-member haystack: name, SKU, notes, tags, shop, sold-as, rate. */
export function designFindParts(row: DesignFindRow): Array<
  string | number | null | undefined | readonly string[]
> {
  return [
    row.name,
    row.sku,
    row.description,
    row.categories ?? [],
    row.companyName,
    row.unit,
    row.rate,
    row.rateMax,
    row.moq,
    ...designRateFindTokens(row.rate, row.rateMax, row.unit),
  ];
}
