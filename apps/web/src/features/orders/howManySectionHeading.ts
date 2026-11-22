/**
 * Subtle How many section title: shop · pack (or whichever part exists).
 * No “Supplier” / “Trader” role words.
 */
export function howManySectionHeading(input: {
  shopName?: string | null;
  packName?: string | null;
}): string {
  const shop = input.shopName?.trim() || '';
  const pack = input.packName?.trim() || '';
  if (shop && pack) return `${shop} · ${pack}`;
  if (shop) return shop;
  if (pack) return pack;
  return '';
}

/** Footer ₹ only when every seller in the basket allows bill totals (default off). */
export function howManyFooterMoneyAllowed(sellerFlags: Array<boolean | null | undefined>): boolean {
  if (sellerFlags.length === 0) return false;
  return sellerFlags.every((flag) => flag === true);
}

export function howManyFooterWithoutMoneyUnlessAllowed<T extends { rows: string[]; money?: string }>(
  summary: T | null,
  allowed: boolean,
): T | null {
  if (!summary) return null;
  if (allowed || !summary.money) return summary;
  const { money: _drop, ...rest } = summary;
  return rest as T;
}
