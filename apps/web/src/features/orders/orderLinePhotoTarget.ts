/** Where an order-line thumb should go when tapped. */
export function orderLinePhotoTarget(
  productId: string | null | undefined,
): { kind: 'product'; href: string } | { kind: 'gallery' } {
  if (productId) {
    return { kind: 'product', href: `/explore/products/${productId}` };
  }
  return { kind: 'gallery' };
}
