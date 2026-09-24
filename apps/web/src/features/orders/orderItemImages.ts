import type { OrderItemView } from '@ekum/domain-types';
import { formatRate } from '@/lib/format';

/** All image URLs on a line — prefers `images`, falls back to legacy `image`. */
export function urlsForOrderItem(item: OrderItemView): string[] {
  const fromArray = item.images.filter((url): url is string => Boolean(url));
  if (fromArray.length > 0) return fromArray;
  if (item.image) return [item.image];
  return [];
}

export function orderLinePhotoInfo(
  item: Pick<OrderItemView, 'name' | 'sku' | 'quantity' | 'rate' | 'unit'>,
): { caption: string; detail: string } {
  const bits = [`${item.quantity} × ${formatRate(item.rate, item.unit)}`];
  const sku = item.sku?.trim();
  if (sku) bits.push(sku);
  return { caption: item.name, detail: bits.join(' · ') };
}

function expandPerPhoto<T>(items: OrderItemView[], value: (item: OrderItemView) => T): T[] {
  return items.flatMap((item) => urlsForOrderItem(item).map(() => value(item)));
}

/** Flat gallery of every photo on the order (for fullscreen viewer swipe set). */
export function orderItemGalleryUrls(items: OrderItemView[]): string[] {
  return items.flatMap((item) => urlsForOrderItem(item));
}

export function orderItemGalleryCaptions(items: OrderItemView[]): string[] {
  return expandPerPhoto(items, (item) => orderLinePhotoInfo(item).caption);
}

export function orderItemGalleryDetails(items: OrderItemView[]): string[] {
  return expandPerPhoto(items, (item) => orderLinePhotoInfo(item).detail);
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
