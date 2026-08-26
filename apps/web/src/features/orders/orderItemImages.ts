import type { OrderItemView } from '@ekum/domain-types';

/** All image URLs on a line — prefers `images`, falls back to legacy `image`. */
export function urlsForOrderItem(item: OrderItemView): string[] {
  const fromArray = item.images.filter((url): url is string => Boolean(url));
  if (fromArray.length > 0) return fromArray;
  if (item.image) return [item.image];
  return [];
}

/** Flat gallery of every photo on the order (for fullscreen viewer swipe set). */
export function orderItemGalleryUrls(items: OrderItemView[]): string[] {
  return items.flatMap((item) => urlsForOrderItem(item));
}

/** Index into `orderItemGalleryUrls` for the first photo on a line. */
export function galleryIndexForItem(items: OrderItemView[], itemId: string): number {
  let index = 0;
  for (const item of items) {
    if (item.id === itemId) return index;
    index += urlsForOrderItem(item).length;
  }
  return 0;
}
