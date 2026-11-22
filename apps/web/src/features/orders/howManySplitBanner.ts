type ShopLine = {
  companyId: string;
  companyName?: string | null;
};

export function howManyShopGroups(products: ShopLine[]): Array<{ name: string; count: number }> {
  const order: string[] = [];
  const map = new Map<string, { name: string; count: number }>();
  for (const product of products) {
    const id = product.companyId?.trim() || 'unknown';
    if (!map.has(id)) {
      order.push(id);
      map.set(id, {
        name: product.companyName?.trim() || 'This shop',
        count: 0,
      });
    }
    map.get(id)!.count += 1;
  }
  return order.map((id) => map.get(id)!);
}

/**
 * Retired sheet banner — multi-shop uses subtle shop·pack separators instead.
 * Kept so call sites stay; always null.
 */
export function howManySplitBanner(_products: ShopLine[]): string | null {
  return null;
}

/** Multi-shop baskets never get a single “Order goes to …”. */
export function howManySingleGoesTo(
  products: ShopLine[],
  orderGoesToName?: string | null,
): string | null {
  if (howManyShopGroups(products).length > 1) return null;
  const name = orderGoesToName?.trim();
  return name || null;
}

export function howManyIsMultiShop(products: ShopLine[]): boolean {
  return howManyShopGroups(products).length > 1;
}
