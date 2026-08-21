import type { SavedItemView } from '@ekum/domain-types';

/** Mosaic +N uses design count, not the 4 preview thumbs. */
export function savedAlbumImageCount(item: SavedItemView, images: string[]): number {
  if (item.kind !== 'collection') return images.length;
  return Math.max(item.imageCount ?? 0, item.productCount ?? 0, images.length);
}
