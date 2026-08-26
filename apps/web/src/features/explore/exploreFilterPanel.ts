export function titleCaseLabel(value: string): string {
  return value
    .split(/[\s_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function pinSelectedOnOpen(pool: readonly string[], selected: readonly string[]): string[] {
  const inPool = new Set(pool);
  const pinned = selected.filter((item) => inPool.has(item));
  const pinnedSet = new Set(pinned);
  const rest = [...pool].filter((item) => !pinnedSet.has(item)).sort((a, b) => a.localeCompare(b));
  return [...pinned, ...rest];
}

export function filterStartsWithPreserveOrder(sessionOrder: readonly string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...sessionOrder];
  return sessionOrder.filter((item) => {
    const raw = item.toLowerCase();
    const label = titleCaseLabel(item).toLowerCase();
    return raw.startsWith(q) || label.startsWith(q);
  });
}

export function toggleValue(selected: readonly string[], value: string): string[] {
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
}

export function addVisible(selected: readonly string[], visible: readonly string[]): string[] {
  return [...new Set([...selected, ...visible])];
}

export function removeVisible(selected: readonly string[], visible: readonly string[]): string[] {
  const drop = new Set(visible);
  return selected.filter((item) => !drop.has(item));
}

export function allVisibleSelected(selected: readonly string[], visible: readonly string[]): boolean {
  return visible.length > 0 && visible.every((item) => selected.includes(item));
}

export function facetSummary(selected: readonly string[], emptyLabel: string): string {
  if (selected.length === 0) return emptyLabel;
  const first = titleCaseLabel(selected[0]!);
  if (selected.length === 1) return first;
  return `${first} + ${selected.length - 1}`;
}

/** One URL write — two setSearchParams in the same click drop the `show` clear. */
export function clearExploreFilterParams(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.delete('show');
  next.delete('story');
  return next;
}

export function mergeFacetOptions(curated: readonly string[], extra: readonly string[]): string[] {
  const unique = [...new Set([...curated, ...extra].map((item) => item.trim()).filter(Boolean))];
  return unique.sort((a, b) => a.localeCompare(b));
}
