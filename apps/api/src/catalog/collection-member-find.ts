/** Haystack bits for in-list collection find (name, SKU, notes, tags). */
export function collectionMemberFind(
  products:
    | Array<{
        product: {
          name?: string | null;
          sku?: string | null;
          description?: string | null;
          categories?: string[] | null;
        };
      }>
    | undefined,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of products ?? []) {
    const product = row.product;
    const bits = [
      product.name,
      product.sku,
      product.description,
      ...(product.categories ?? []),
    ];
    for (const bit of bits) {
      const value = bit?.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}
