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

/** Mixed basket — never a single “Order goes to …”. */
export function howManySplitBanner(products: ShopLine[]): string | null {
  const shops = howManyShopGroups(products);
  if (shops.length < 2) return null;
  const parts = shops.map(
    (shop) => `${shop.name} (${shop.count} design${shop.count === 1 ? '' : 's'})`,
  );
  return `This becomes ${shops.length} orders — ${parts.join(', ')}`;
}

export function howManySingleGoesTo(
  products: ShopLine[],
  orderGoesToName?: string | null,
): string | null {
  if (howManyShopGroups(products).length > 1) return null;
  const name = orderGoesToName?.trim();
  return name || null;
}
