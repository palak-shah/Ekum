/**
 * Server-side repost pricing resolve — immediate hop only; fail closed.
 */
import {
  RateVisibility,
  RepostPricingMode,
  effectiveRepostPricingConfig,
  resolveImmediateSourceInput,
  resolveRepostDesignPricing,
  type RepostPricingConfig,
  type ResolvedRepostPricing,
  type RepostPricingMode as Mode,
  isRepostPricingMode,
} from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import {
  withRepostHopPerf,
  type RepostHopFailure,
} from './repost-hop-instrument';

function asNumber(value: { toNumber(): number } | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

export function packPricingConfigFromRow(row: {
  repostPricingMode?: string | null;
  repostMarginValue?: { toNumber(): number } | number | null;
  repostEditedRate?: { toNumber(): number } | number | null;
  repostEditOwnBase?: { toNumber(): number } | number | null;
}): RepostPricingConfig {
  return {
    mode: isRepostPricingMode(row.repostPricingMode) ? row.repostPricingMode : null,
    marginValue: asNumber(row.repostMarginValue),
    editedRate: asNumber(row.repostEditedRate),
    editOwnBase: asNumber(row.repostEditOwnBase),
  };
}

export function memberPricingOverrideFromRow(row: {
  pricingMode?: string | null;
  marginValue?: { toNumber(): number } | number | null;
  editedRate?: { toNumber(): number } | number | null;
  editOwnBase?: { toNumber(): number } | number | null;
}): Partial<RepostPricingConfig> | null {
  if (!isRepostPricingMode(row.pricingMode)) return null;
  return {
    mode: row.pricingMode,
    marginValue: asNumber(row.marginValue),
    editedRate: asNumber(row.editedRate),
    editOwnBase: asNumber(row.editOwnBase),
  };
}

/** Non-repost pack rate for a design: pack rate wins, else product rate. */
export function catalogHierarchyRate(input: {
  packRate: number | null;
  productRate: number | null;
}): number | null {
  if (input.packRate != null && Number.isFinite(input.packRate)) return input.packRate;
  if (input.productRate != null && Number.isFinite(input.productRate)) return input.productRate;
  return null;
}

export type PricingPersistDto = {
  repostPricingMode?: Mode | null;
  repostMarginValue?: number | null;
  repostEditedRate?: number | null;
  repostEditOwnBase?: number | null;
};

export function pricingDataForWrite(dto: PricingPersistDto): {
  repostPricingMode: string | null;
  repostMarginValue: number | null;
  repostEditedRate: number | null;
  repostEditOwnBase: number | null;
} | null {
  if (dto.repostPricingMode === undefined) return null;
  const validated = effectiveRepostPricingConfig(
    {
      mode: null,
      marginValue: null,
      editedRate: null,
      editOwnBase: null,
    },
    {
      mode: dto.repostPricingMode,
      marginValue: dto.repostMarginValue ?? null,
      editedRate: dto.repostEditedRate ?? null,
      editOwnBase: dto.repostEditOwnBase ?? null,
    },
  );
  return {
    repostPricingMode: validated.mode,
    repostMarginValue: validated.marginValue,
    repostEditedRate: validated.editedRate,
    repostEditOwnBase: validated.editOwnBase,
  };
}

type PackResolveRow = {
  id: string;
  companyId: string;
  rate: { toNumber(): number } | number | null;
  rateVisibility: string;
  /** Rate per — buyer-facing round (pc → ₹1, mtr → 0.25). */
  catalogRateUnit?: string | null;
  repostSourceCollectionId?: string | null;
  repostPricingMode?: string | null;
  repostMarginValue?: { toNumber(): number } | number | null;
  repostEditedRate?: { toNumber(): number } | number | null;
  repostEditOwnBase?: { toNumber(): number } | number | null;
};

type PackResolveOpts = {
  /** Who is reading — for source disclosure. Pack owner always disclosed to self when they can open source. */
  viewerCompanyId: string;
  /** When true, treat source as disclosed if viewer can open source products. */
  sourceDisclosed?: boolean;
  /** Pack ids already on this resolve walk — cycle → fail closed. */
  visitedPackIds?: Set<string>;
};

/**
 * Resolve buyer-facing rates for active members of a (possibly repost) pack.
 * Non-repost → catalog hierarchy only (no calc modes).
 * Root calls emit F-12 hop perf samples (no ids / rates in logs).
 */
export async function resolvePackMemberBuyerRates(
  prisma: PrismaService,
  pack: PackResolveRow,
  opts: PackResolveOpts,
): Promise<Map<string, ResolvedRepostPricing>> {
  const isRoot = !opts.visitedPackIds;
  if (!isRoot) {
    return resolvePackMemberBuyerRatesInner(prisma, pack, {
      ...opts,
      visitedPackIds: opts.visitedPackIds!,
    });
  }
  return withRepostHopPerf('pricing_resolve', async (note) => {
    const visited = new Set<string>();
    const stats = { queryRounds: 0, failure: 'none' as RepostHopFailure };
    const out = await resolvePackMemberBuyerRatesInner(
      prisma,
      pack,
      { ...opts, visitedPackIds: visited },
      stats,
    );
    note({
      hopCount: visited.size,
      queryRounds: stats.queryRounds,
      failure: stats.failure,
      packCount: 1,
    });
    return out;
  });
}

async function resolvePackMemberBuyerRatesInner(
  prisma: PrismaService,
  pack: PackResolveRow,
  opts: PackResolveOpts & { visitedPackIds: Set<string> },
  stats?: { queryRounds: number; failure: RepostHopFailure },
): Promise<Map<string, ResolvedRepostPricing>> {
  const out = new Map<string, ResolvedRepostPricing>();
  const visited = opts.visitedPackIds;
  if (visited.has(pack.id)) {
    if (stats) stats.failure = 'cycle';
    return out;
  }
  visited.add(pack.id);
  if (stats) stats.queryRounds += 1;

  const members = await prisma.collectionProduct.findMany({
    where: { collectionId: pack.id, excluded: false },
    select: {
      productId: true,
      pricingMode: true,
      marginValue: true,
      editedRate: true,
      editOwnBase: true,
      product: {
        select: { id: true, rate: true, companyId: true, catalogRateUnit: true },
      },
    },
  });

  const sourceId = pack.repostSourceCollectionId ?? null;
  // Product-sourced (or legacy) child: no upstream pack hop — still apply pack/member calc.
  if (!sourceId) {
    const packConfig = packPricingConfigFromRow(pack);
    const disclosed =
      opts.sourceDisclosed === true || opts.viewerCompanyId === pack.companyId;
    for (const row of members) {
      const productRate = asNumber(row.product.rate);
      const rateUnit =
        row.product.catalogRateUnit ?? pack.catalogRateUnit ?? null;
      const config = effectiveRepostPricingConfig(
        packConfig,
        memberPricingOverrideFromRow(row),
      );
      if (!config.mode) {
        out.set(row.productId, {
          sourceRate: null,
          sourceDisclosed: false,
          buyerFacing: catalogHierarchyRate({
            packRate: asNumber(pack.rate),
            productRate,
          }),
          canQuoteIndependent: true,
          editInvalidated: false,
          mode: null,
        });
        continue;
      }
      const sourceRate = disclosed ? productRate : null;
      out.set(
        row.productId,
        resolveRepostDesignPricing({
          config,
          sourceRate,
          sourceDisclosed: sourceRate != null,
          rateUnit,
        }),
      );
    }
    return out;
  }

  if (stats) stats.queryRounds += 1;
  const source = await prisma.collection.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      companyId: true,
      rate: true,
      rateVisibility: true,
      repostSourceCollectionId: true,
      repostPricingMode: true,
      repostMarginValue: true,
      repostEditedRate: true,
      repostEditOwnBase: true,
      products: {
        where: { excluded: false },
        select: {
          productId: true,
          pricingMode: true,
          marginValue: true,
          editedRate: true,
          editOwnBase: true,
          product: { select: { id: true, rate: true } },
        },
      },
    },
  });

  // Missing source or cycle back into a visited pack → incomplete lineage.
  const cyclicSource = Boolean(sourceId && visited.has(sourceId));
  if (cyclicSource && stats) stats.failure = 'cycle';
  if (!source && stats && stats.failure === 'none') stats.failure = 'missing_source';
  const lineageComplete = Boolean(source) && !cyclicSource;
  // Recurse: resolve upstream buyer-facing for each product (immediate hop).
  let upstreamRates = new Map<string, number | null>();
  if (source && lineageComplete) {
    if (source.repostSourceCollectionId && isRepostPricingMode(source.repostPricingMode)) {
      // Resolve upstream as its owner would (calc numbers), then gate disclosure below.
      const upstreamResolved = await resolvePackMemberBuyerRatesInner(
        prisma,
        source,
        {
          viewerCompanyId: source.companyId,
          sourceDisclosed: true,
          visitedPackIds: visited,
        },
        stats,
      );
      for (const [productId, resolved] of upstreamResolved) {
        upstreamRates.set(productId, resolved.buyerFacing);
      }
    } else {
      const packRate = asNumber(source.rate);
      for (const row of source.products) {
        upstreamRates.set(
          row.productId,
          catalogHierarchyRate({
            packRate,
            productRate: asNumber(row.product.rate),
          }),
        );
      }
    }
  }

  const disclosed =
    opts.sourceDisclosed === true ||
    opts.viewerCompanyId === pack.companyId ||
    (source != null && source.rateVisibility === RateVisibility.Visible);

  const packConfig = packPricingConfigFromRow(pack);

  for (const row of members) {
    const immediate = resolveImmediateSourceInput({
      lineageComplete,
      immediateBuyerFacing: upstreamRates.get(row.productId) ?? null,
      immediateDisclosedToTrader: disclosed,
    });
    const config = effectiveRepostPricingConfig(
      packConfig,
      memberPricingOverrideFromRow(row),
    );
    // No calc mode yet → fall back to hierarchy (legacy repost behaviour).
    if (!config.mode) {
      out.set(row.productId, {
        sourceRate: immediate.sourceRate,
        sourceDisclosed: immediate.sourceDisclosed,
        buyerFacing: catalogHierarchyRate({
          packRate: asNumber(pack.rate),
          productRate: asNumber(row.product.rate),
        }),
        canQuoteIndependent: true,
        editInvalidated: false,
        mode: null,
      });
      continue;
    }
    const rateUnit = row.product.catalogRateUnit ?? pack.catalogRateUnit ?? null;
    out.set(
      row.productId,
      resolveRepostDesignPricing({
        config,
        sourceRate: immediate.sourceRate,
        sourceDisclosed: immediate.sourceDisclosed,
        rateUnit,
      }),
    );
  }
  return out;
}

/** Aggregate pack card band from resolved member buyer-facing rates. */
export function buyerFacingBand(
  rates: Array<number | null>,
): { rateMin: number | null; rateMax: number | null } {
  const priced = rates.filter((r): r is number => r != null && Number.isFinite(r));
  if (priced.length === 0) return { rateMin: null, rateMax: null };
  const rateMin = Math.min(...priced);
  const rateMax = Math.max(...priced);
  return { rateMin, rateMax: rateMax > rateMin ? rateMax : null };
}

type PackBandRow = {
  id: string;
  companyId: string;
  rate: { toNumber(): number } | number | null;
  rateVisibility: string;
  repostSourceCollectionId?: string | null;
  repostPricingMode?: string | null;
  repostMarginValue?: { toNumber(): number } | number | null;
  repostEditedRate?: { toNumber(): number } | number | null;
  repostEditOwnBase?: { toNumber(): number } | number | null;
};

/**
 * Resolve buyer-facing bands for packs that use Batch 3 calc modes.
 * Shared by Explore, Search, and shop shelves.
 */
export async function resolvedBandsForPacks(
  prisma: PrismaService,
  viewerCompanyId: string,
  rows: PackBandRow[],
): Promise<Map<string, { rateMin: number | null; rateMax: number | null }>> {
  const out = new Map<string, { rateMin: number | null; rateMax: number | null }>();
  const calcRows = rows.filter((row) => isRepostPricingMode(row.repostPricingMode));
  // Hotspot (F-12): one full resolve walk per calc pack — instrumented per root call.
  // Do not merge walks here without measuring; fail-closed behaviour must stay.
  await Promise.all(
    calcRows.map(async (row) => {
      const resolved = await resolvePackMemberBuyerRates(prisma, row, {
        viewerCompanyId,
      });
      out.set(
        row.id,
        buyerFacingBand([...resolved.values()].map((item) => item.buyerFacing)),
      );
    }),
  );
  return out;
}

/**
 * When a design is opened outside its album (product detail), prefer the trader
 * pack’s resolved buyer-facing ₹ over raw mill Product.rate when a curated calc
 * pack contains the design and the pack Shows rates (or viewer is pack owner).
 */
export async function buyerFacingViaCuratedPackForProduct(
  prisma: PrismaService,
  viewerCompanyId: string,
  productId: string,
  productCompanyId: string,
): Promise<number | null | undefined> {
  const rows = await prisma.collectionProduct.findMany({
    where: {
      productId,
      excluded: false,
      collection: {
        status: 'published',
        companyId: { not: productCompanyId },
      },
    },
    select: {
      collection: {
        select: {
          id: true,
          companyId: true,
          rate: true,
          rateVisibility: true,
          repostSourceCollectionId: true,
          repostPricingMode: true,
          repostMarginValue: true,
          repostEditedRate: true,
          repostEditOwnBase: true,
        },
      },
    },
    take: 12,
  });
  let sawOnRequestCalc = false;
  for (const row of rows) {
    const pack = row.collection;
    if (!isRepostPricingMode(pack.repostPricingMode)) continue;
    const isOwner = viewerCompanyId === pack.companyId;
    if (!isOwner && pack.rateVisibility !== RateVisibility.Visible) {
      sawOnRequestCalc = true;
      continue;
    }
    const resolved = await resolvePackMemberBuyerRates(prisma, pack, {
      viewerCompanyId,
    });
    const hit = resolved.get(productId);
    if (hit) return hit.buyerFacing;
  }
  // Only On-request calc packs — hide rather than leak mill Product.rate.
  if (sawOnRequestCalc) return null;
  // No curated calc pack — caller keeps Product.rate.
  return undefined;
}

export { RepostPricingMode };
