/**
 * Card mosaics prepend coverImage. The opened album is member designs only.
 * If cover is not one of those photos, the first mosaic cell would vanish.
 */
export function coverMissingFromMembers(
  coverImage: string | null | undefined,
  products: Array<{ images: string[] }> | null | undefined,
): boolean {
  if (!coverImage) return false;
  return !(products ?? []).some((product) => product.images.includes(coverImage));
}
