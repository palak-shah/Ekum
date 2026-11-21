import { CollectionStatus } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import {
  buyerShouldOmitRepostPack,
  filterViewerEligibleMembers,
  upstreamChainSoftResult,
  type UpstreamPackRow,
} from './repost-availability';
import { withRepostHopPerf } from './repost-hop-instrument';

/** Load ancestor packs (unbounded) for soft-unavailable checks. */
export async function loadUpstreamPackRows(
  prisma: PrismaService,
  sourceIds: Array<string | null | undefined>,
): Promise<Map<string, UpstreamPackRow>> {
  const roots = [...new Set(sourceIds.filter((id): id is string => Boolean(id)))];
  return withRepostHopPerf('availability', async (note) => {
    const byId = new Map<string, UpstreamPackRow>();
    let pending = roots;
    let queryRounds = 0;

    while (pending.length > 0) {
      queryRounds += 1;
      const rows = await prisma.collection.findMany({
        where: { id: { in: pending } },
        select: {
          id: true,
          allowForward: true,
          status: true,
          repostSourceCollectionId: true,
        },
      });
      const next: string[] = [];
      for (const row of rows) {
        byId.set(row.id, {
          id: row.id,
          allowForward: row.allowForward !== false,
          status: row.status,
          repostSourceCollectionId: row.repostSourceCollectionId,
        });
        if (
          row.repostSourceCollectionId &&
          !byId.has(row.repostSourceCollectionId)
        ) {
          next.push(row.repostSourceCollectionId);
        }
      }
      pending = next;
    }
    note({
      hopCount: byId.size,
      queryRounds,
      packCount: roots.length,
      failure: 'none',
    });
    return byId;
  });
}

export type BuyerRepostPackAvailability = {
  /** Packs buyers must not see (fail-closed or zero eligible). */
  omitIds: Set<string>;
  /** Packs with soft upstream that still have eligible locals — filter members to these product ids. */
  eligibleProductIdsByPackId: Map<string, Set<string>>;
  /** Packs whose upstream chain is soft (including those still listed). */
  chainSoftIds: Set<string>;
};

/**
 * Buyer pack omit + eligible member sets for mixed soft-unavailable.
 * Callers that only need omit can use {@link packIdsSoftUnavailable}.
 */
export async function resolveBuyerRepostPackAvailability(
  prisma: PrismaService,
  packs: Array<{
    id: string;
    companyId: string;
    repostSourceCollectionId?: string | null;
  }>,
): Promise<BuyerRepostPackAvailability> {
  const omitIds = new Set<string>();
  const eligibleProductIdsByPackId = new Map<string, Set<string>>();
  const chainSoftIds = new Set<string>();
  if (packs.length === 0) {
    return { omitIds, eligibleProductIdsByPackId, chainSoftIds };
  }

  const upstream = await loadUpstreamPackRows(
    prisma,
    packs.map((p) => p.repostSourceCollectionId),
  );

  const softCandidates: typeof packs = [];
  for (const pack of packs) {
    const chain = upstreamChainSoftResult(
      pack,
      upstream,
      CollectionStatus.Published,
    );
    if (!chain.soft) continue;
    chainSoftIds.add(pack.id);
    if (chain.failClosed) {
      omitIds.add(pack.id);
      continue;
    }
    softCandidates.push(pack);
  }

  if (softCandidates.length === 0) {
    return { omitIds, eligibleProductIdsByPackId, chainSoftIds };
  }

  const memberRows = await prisma.collectionProduct.findMany({
    where: {
      collectionId: { in: softCandidates.map((p) => p.id) },
      excluded: false,
    },
    select: {
      collectionId: true,
      membershipOrigin: true,
      excluded: true,
      product: {
        select: {
          id: true,
          companyId: true,
          allowForward: true,
          status: true,
        },
      },
    },
  });

  const byPack = new Map<string, typeof memberRows>();
  for (const row of memberRows) {
    const list = byPack.get(row.collectionId) ?? [];
    list.push(row);
    byPack.set(row.collectionId, list);
  }

  for (const pack of softCandidates) {
    const chain = upstreamChainSoftResult(
      pack,
      upstream,
      CollectionStatus.Published,
    );
    const rows = byPack.get(pack.id) ?? [];
    const eligible = filterViewerEligibleMembers(
      pack.companyId,
      rows.map((r) => ({
        membershipOrigin: r.membershipOrigin,
        excluded: r.excluded,
        product: {
          id: r.product.id,
          companyId: r.product.companyId,
          allowForward: r.product.allowForward !== false,
          status: r.product.status,
        },
      })),
      true,
      CollectionStatus.Published,
    );
    if (
      buyerShouldOmitRepostPack({
        chain,
        eligibleMemberCount: eligible.length,
      })
    ) {
      omitIds.add(pack.id);
    } else {
      eligibleProductIdsByPackId.set(
        pack.id,
        new Set(eligible.map((r) => r.product.id)),
      );
    }
  }

  return { omitIds, eligibleProductIdsByPackId, chainSoftIds };
}

/**
 * Pack ids buyers should omit from Explore/shop/search.
 * Mixed packs with remaining local designs are **not** omitted.
 */
export async function packIdsSoftUnavailable(
  prisma: PrismaService,
  packs: Array<{
    id: string;
    companyId?: string;
    repostSourceCollectionId?: string | null;
  }>,
): Promise<Set<string>> {
  const withCompany = packs.filter(
    (p): p is { id: string; companyId: string; repostSourceCollectionId?: string | null } =>
      typeof p.companyId === 'string' && p.companyId.length > 0,
  );
  // Legacy callers without companyId: fail closed to prior whole-pack soft.
  if (withCompany.length !== packs.length) {
    const upstream = await loadUpstreamPackRows(
      prisma,
      packs.map((p) => p.repostSourceCollectionId),
    );
    const out = new Set<string>();
    for (const pack of packs) {
      if (
        upstreamChainSoftResult(pack, upstream, CollectionStatus.Published).soft
      ) {
        out.add(pack.id);
      }
    }
    return out;
  }
  const resolved = await resolveBuyerRepostPackAvailability(prisma, withCompany);
  return resolved.omitIds;
}

/**
 * Honest remaining chrome: keep only eligible members + recount.
 * No-op when eligibleIds is undefined (pack not chain-soft) or viewer owns the pack.
 */
export function projectEligibleCollectionMembers<
  T extends {
    companyId: string;
    products?: Array<{ product: { id: string } }>;
    _count?: { products: number };
  },
>(row: T, viewerCompanyId: string, eligibleIds: Set<string> | undefined): T {
  if (!eligibleIds || row.companyId === viewerCompanyId) return row;
  const products = (row.products ?? []).filter((entry) =>
    eligibleIds.has(entry.product.id),
  );
  return {
    ...row,
    products,
    _count: {
      ...(row._count ?? { products: products.length }),
      products: products.length,
    },
  };
}
