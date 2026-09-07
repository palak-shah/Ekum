import type { SavedItemView } from '@ekum/domain-types';

/**
 * Mosaic layout uses available preview URLs. productCount only drives +N when
 * there are already 4 thumbs (never invent empty cells for 2–3 designs).
 */
export function savedAlbumImageCount(item: SavedItemView, images: string[]): number {
  if (item.kind !== 'collection') return images.length;
  if (images.length < 4) return images.length;
  return Math.max(item.imageCount ?? 0, item.productCount ?? 0, images.length);
}
