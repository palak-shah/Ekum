import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';

/** Image URLs for POST /products from a chat product card (must be absolute http(s)). */
export function productImagesFromChatReference(reference: {
  image?: string | null;
  images?: string[] | null;
}): string[] {
  const raw =
    reference.images && reference.images.length > 0
      ? reference.images
      : reference.image
        ? [reference.image]
        : [];
  return raw
    .map((url) => toAbsoluteMediaUrl(url.trim()))
    .filter((url) => url.length > 0 && !url.startsWith('blob:') && !url.startsWith('data:'));
}
