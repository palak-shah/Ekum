/** Client-side needle match for chat attach pickers. */
export function matchesAttachSearch(haystack: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle);
}

export function filterByAttachSearch<T>(
  items: T[],
  query: string,
  haystackOf: (item: T) => string,
): T[] {
  const needle = query.trim();
  if (!needle) return items;
  return items.filter((item) => matchesAttachSearch(haystackOf(item), needle));
}
