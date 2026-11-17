import { BUSINESS_SHOWCASE_MAX } from '@ekum/domain-types';

/** Append URLs, skip duplicates and respect the showcase max. */
export function appendShowcaseUrls(
  current: string[],
  incoming: string[],
  max = BUSINESS_SHOWCASE_MAX,
): string[] {
  const next = [...current];
  const seen = new Set(current);
  for (const url of incoming) {
    if (!url || seen.has(url)) continue;
    if (next.length >= max) break;
    next.push(url);
    seen.add(url);
  }
  return next;
}

export function removeShowcaseUrl(current: string[], url: string): string[] {
  return current.filter((item) => item !== url);
}

export function moveShowcaseUrl(
  current: string[],
  index: number,
  direction: -1 | 1,
): string[] {
  const target = index + direction;
  if (index < 0 || index >= current.length) return current;
  if (target < 0 || target >= current.length) return current;
  const next = [...current];
  const tmp = next[index]!;
  next[index] = next[target]!;
  next[target] = tmp;
  return next;
}

/** Gallery index for a showcase thumb when cover is image 1. */
export function showcaseGalleryIndex(
  coverUrl: string | null | undefined,
  showcaseIndex: number,
): number {
  return (coverUrl ? 1 : 0) + showcaseIndex;
}

/** Showcase-only PhotoViewer list — saved order, no cover. */
export function showcaseOnlyUrls(
  showcaseUrls: string[] | null | undefined,
): string[] {
  return (showcaseUrls ?? []).filter((url): url is string => Boolean(url));
}

export function showcaseSlotsLeft(
  currentLength: number,
  max = BUSINESS_SHOWCASE_MAX,
): number {
  return Math.max(0, max - currentLength);
}
