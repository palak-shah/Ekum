/**
 * Visitor mill credit (Show supplier name) — trust ladder hop ceiling.
 * Owner library cues use raw member shops elsewhere; this is visitor-facing only.
 */

export type SourceCreditHop = {
  companyId: string;
  companyName: string;
  showSourceShops: boolean;
};

export type SourceCreditHopRow = {
  companyId: string;
  companyName: string;
  showSourceShops: boolean;
  repostSourceCollectionId?: string | null;
};

export type SourceCreditOpts = {
  /**
   * Pack’s `repostSourceCollectionId`. When set but `sourceHops` is empty
   * (source row unloadable), do not credit the end mill.
   */
  declaredSourceCollectionId?: string | null;
};

/** True when lineage claims a source pack but hops could not be resolved. */
export function sourceHopUnresolved(
  declaredSourceCollectionId: string | null | undefined,
  sourceHops: SourceCreditHop[],
): boolean {
  return Boolean(declaredSourceCollectionId) && sourceHops.length === 0;
}

/** Walk repostSourceCollectionId chain (immediate → outer). */
export function sourceHopsFromRows(
  immediateSourceId: string | null | undefined,
  byId: Map<string, SourceCreditHopRow>,
): SourceCreditHop[] {
  const hops: SourceCreditHop[] = [];
  let next = immediateSourceId ?? null;
  const seen = new Set<string>();
  while (next && !seen.has(next)) {
    seen.add(next);
    const row = byId.get(next);
    if (!row) break;
    hops.push({
      companyId: row.companyId,
      companyName: row.companyName,
      showSourceShops: row.showSourceShops,
    });
    next = row.repostSourceCollectionId ?? null;
  }
  return hops;
}

/**
 * Walk immediate→outer source hops. First hop that hid suppliers → that hop’s company.
 * All hops revealed (or none) → end mill company id.
 */
export function revealedCreditCompanyId(
  millCompanyId: string,
  sourceHops: SourceCreditHop[],
): string {
  for (const hop of sourceHops) {
    if (!hop.showSourceShops) return hop.companyId;
  }
  return millCompanyId;
}

type ProductShopRow = {
  product: { companyId?: string; company?: { name: string } | null };
};

/** Foreign shop names for card `sourceShopNames` when Show supplier is on. */
export function collectionSourceShopNames(
  packCompanyId: string,
  showSourceShops: boolean,
  products?: ProductShopRow[],
  sourceHops: SourceCreditHop[] = [],
  opts: SourceCreditOpts = {},
): string[] {
  if (!showSourceShops) return [];
  // Declared source but unloadable — never fall back to raw mill names.
  if (sourceHopUnresolved(opts.declaredSourceCollectionId, sourceHops)) {
    return [];
  }
  const hopName = new Map(
    sourceHops.map((hop) => [hop.companyId, hop.companyName.trim()] as const),
  );
  const names = new Map<string, string>();
  for (const row of products ?? []) {
    const millId = row.product.companyId;
    if (!millId || millId === packCompanyId) continue;
    const creditId = revealedCreditCompanyId(millId, sourceHops);
    if (creditId === packCompanyId) continue;
    const name =
      creditId === millId
        ? row.product.company?.name?.trim()
        : hopName.get(creditId);
    if (name) names.set(creditId, name);
  }
  return [...names.values()];
}

/** Per-design shop label on album / Explore for visitors (and owners see real mill). */
export function visitorDesignCreditCompanyName(input: {
  isOwner: boolean;
  showSourceShops: boolean;
  packCompanyId: string;
  packCompanyName: string;
  productCompanyId: string;
  productCompanyName: string | null;
  sourceHops?: SourceCreditHop[];
  declaredSourceCollectionId?: string | null;
}): string {
  const {
    isOwner,
    showSourceShops,
    packCompanyId,
    packCompanyName,
    productCompanyId,
    productCompanyName,
    sourceHops = [],
    declaredSourceCollectionId,
  } = input;
  const isForeign = productCompanyId !== packCompanyId;
  if (isOwner || !isForeign) {
    return productCompanyName?.trim() || packCompanyName;
  }
  if (!showSourceShops) {
    return packCompanyName;
  }
  if (sourceHopUnresolved(declaredSourceCollectionId, sourceHops)) {
    return packCompanyName;
  }
  const creditId = revealedCreditCompanyId(productCompanyId, sourceHops);
  if (creditId === productCompanyId) {
    return productCompanyName?.trim() || packCompanyName;
  }
  if (creditId === packCompanyId) {
    return packCompanyName;
  }
  const hop = sourceHops.find((row) => row.companyId === creditId);
  return hop?.companyName.trim() || packCompanyName;
}
