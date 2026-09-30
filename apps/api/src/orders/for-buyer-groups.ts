export type ForBuyerLine = {
  productId: string;
  quantity: number;
  rate?: number;
};

export function groupForBuyerLines(
  items: ForBuyerLine[],
  products: Array<{ id: string; companyId: string }>,
  actorCompanyId: string,
): { own: ForBuyerLine[]; byMill: Map<string, ForBuyerLine[]> } {
  const byId = new Map(products.map((row) => [row.id, row]));
  const own: ForBuyerLine[] = [];
  const byMill = new Map<string, ForBuyerLine[]>();
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue;
    if (product.companyId === actorCompanyId) {
      own.push(item);
      continue;
    }
    const bucket = byMill.get(product.companyId) ?? [];
    bucket.push(item);
    byMill.set(product.companyId, bucket);
  }
  return { own, byMill };
}
