export type SourceShop = { id: string; name: string };

/** Owner-only quiet line. Empty when every member is the owner’s shop. */
export function collectionOwnerSourceLine(
  ownerCompanyId: string,
  shops: SourceShop[],
): string | null {
  const unique = new Map<string, string>();
  for (const shop of shops) {
    if (!shop.id) continue;
    unique.set(shop.id, shop.name.trim() || 'a shop');
  }
  const others = [...unique.entries()].filter(([id]) => id !== ownerCompanyId);
  if (others.length === 0) return null;
  const names = others.map(([, name]) => name);
  const hasOwn = unique.has(ownerCompanyId);
  if (!hasOwn) {
    if (names.length === 1) return `From ${names[0]}`;
    if (names.length === 2) return `From ${names[0]}, ${names[1]}`;
    return `From ${names.length} shops`;
  }
  if (names.length === 1) return `Yours and ${names[0]}`;
  return `Yours and ${names.length} shops`;
}
