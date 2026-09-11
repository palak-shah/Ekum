import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';

function isAbsoluteHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

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
    .filter((url) => url.length > 0 && isAbsoluteHttpUrl(url));
}
