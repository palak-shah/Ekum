import { categoriesToTagSlots, type TagSlots } from '@ekum/domain-types';

/** Short list — same judgment as city/category SuggestInput. */
export const TAG_SUGGEST_CAP = 8;

export function uniqueTagLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of labels) {
    const label = raw.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

/** Empty focus = used first, then official. Typing filters the same mix. */
export function filterTagSuggestions(
  query: string,
  official: string[],
  used: string[],
  cap = TAG_SUGGEST_CAP,
): string[] {
  const q = query.trim().toLowerCase();
  const usedLabels = uniqueTagLabels(used);
  const usedKeys = new Set(usedLabels.map((label) => label.toLowerCase()));
  const officialRest = uniqueTagLabels(official).filter(
    (label) => !usedKeys.has(label.toLowerCase()),
  );
  const pool = [...usedLabels, ...officialRest];
  if (!q) return pool.slice(0, cap);
  return pool.filter((label) => label.toLowerCase().includes(q)).slice(0, cap);
}

export function collectUsedTagSlots(
  rows: Array<{ categories?: string[] | null }>,
): TagSlots {
  const items: string[] = [];
  const qualities: string[] = [];
  const sizes: string[] = [];
  for (const row of rows) {
    const slots = categoriesToTagSlots(row.categories ?? []);
    items.push(...slots.items);
    qualities.push(...slots.qualities);
    sizes.push(...slots.sizes);
  }
  return {
    items: uniqueTagLabels(items),
    qualities: uniqueTagLabels(qualities),
    sizes: uniqueTagLabels(sizes),
  };
}
