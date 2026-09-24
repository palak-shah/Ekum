export type CatalogShareLinkBody =
  | { collectionId: string }
  | { productId: string }
  | { productIds: string[] };

/** Same units as chat: each album is a card; leftover designs are one card. */
export function catalogShareLinkBodies(input: {
  collectionIds: string[];
  productIds: string[];
}): CatalogShareLinkBody[] {
  const bodies: CatalogShareLinkBody[] = [];
  for (const raw of input.collectionIds) {
    const collectionId = raw.trim();
    if (collectionId) bodies.push({ collectionId });
  }
  const productIds = input.productIds.map((id) => id.trim()).filter(Boolean);
  if (productIds.length >= 2) {
    bodies.push({ productIds });
  } else if (productIds[0]) {
    bodies.push({ productId: productIds[0] });
  }
  return bodies;
}

export function catalogShareCanLink(input: {
  collectionIds: string[];
  productIds: string[];
}): boolean {
  return catalogShareLinkBodies(input).length > 0;
}

export function catalogShareCopiedToast(linkCount: number): string {
  if (linkCount <= 1) return 'Link copied · 48 hours';
  return `${linkCount} links copied · 48 hours`;
}

/** Stack extra doors in the body so WhatsApp keeps every URL tappable. */
export function catalogShareInviteText(lines: string[], urls: string[]): string {
  const parts: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) parts.push(trimmed);
  }
  for (const url of urls) {
    const trimmed = url.trim();
    if (trimmed && !parts.some((part) => part.includes(trimmed))) {
      parts.push(trimmed);
    }
  }
  return parts.join('\n');
}
