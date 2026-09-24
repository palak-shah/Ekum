import type { SavedItemView } from '@ekum/domain-types';
import { collectionMosaicCount } from '@/ui/albumMosaic';

/**
 * Mosaic layout uses available preview URLs. productCount only drives +N when
 * there are already 4 thumbs (never invent empty cells for 2–3 designs).
 */
export function savedAlbumImageCount(item: SavedItemView, images: string[]): number {
  if (item.kind !== 'collection') return images.length;
  return collectionMosaicCount({
    productCount: item.productCount ?? 0,
    previewCount: images.length,
  });
}
