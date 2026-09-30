import { categoryDisplayLabel } from '@ekum/domain-types';

/**
 * Mosaic layout uses available thumbs only (never empty cells).
 * +N is leftover designs after the four cells, not extra photos / cover.
 */
export function collectionMosaicCount(input: {
  productCount: number;
  previewCount: number;
}): number {
  if (input.previewCount < 4) return input.previewCount;
  return Math.max(input.productCount, input.previewCount);
}

/** Fourth-cell overlay. Null when everything fits in four thumbs. */
export function albumOverflowLabel(total: number): string | null {
  if (total <= 4) return null;
  return `+${total - 4}`;
}

export function designCountLabel(count: number): string {
  return count === 1 ? '1 design' : `${count} designs`;
}

/** Explore / shop / You pack Feed caption — no From / photo count / audience. */
export function packFeedCaption(input: {
  live: boolean;
  productCount: number;
  when?: string | null;
  statusLine?: string | null;
}): string {
  const lead = input.live
    ? designCountLabel(input.productCount)
    : input.statusLine?.trim() || designCountLabel(input.productCount);
  return [lead, input.when?.trim()].filter(Boolean).join(' · ');
}

/** Second Feed line — tags and/or From. Empty when neither exists. */
export function packFeedDetailLine(input: {
  tags?: string[] | null;
  sourceLine?: string | null;
  maxTags?: number;
}): string {
  const max = input.maxTags ?? 3;
  const tags = (input.tags ?? [])
    .map((tag) => categoryDisplayLabel(tag.trim()))
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, max);
  const source = input.sourceLine?.trim() || '';
  return [...tags, source].filter(Boolean).join(' · ');
}

/**
 * Feed single photo: 4∶5 so a model / full print loses only a little top and bottom.
 * Mosaics and grid stay square.
 */
export function albumMediaAspectClass(
  imageCount: number,
  frame: 'square' | 'feed' = 'square',
): string {
  if (frame === 'feed' && imageCount <= 1) return 'aspect-[4/5]';
  return 'aspect-square';
}
