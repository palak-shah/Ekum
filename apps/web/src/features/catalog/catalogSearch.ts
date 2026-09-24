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
  return hay.includes(needle);
}

/** Design / album-member haystack: name, SKU, notes, tags, shop, sold-as. */
export function designFindParts(row: {
  name?: string | null;
  sku?: string | null;
  description?: string | null;
  categories?: readonly string[] | null;
  companyName?: string | null;
  unit?: string | null;
  rate?: number | null;
  rateMax?: number | null;
  moq?: number | null;
}): Array<string | number | null | undefined | readonly string[]> {
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
  ];
}
