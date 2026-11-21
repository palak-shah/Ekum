/**
 * P1/P2 soft-unavailable — derived from upstream allowForward / publish state.
 * Descendants stay Published; buyers must not see content until upstream restores.
 * Mixed packs: synced members soft when chain soft; local may remain eligible.
 */

import { MembershipOrigin } from '@ekum/domain-types';

export type UpstreamPackRow = {
  id: string;
  allowForward: boolean;
  status: string;
  repostSourceCollectionId?: string | null;
};

export type UpstreamProductRow = {
  id: string;
  allowForward: boolean;
  status: string;
};

export type RepostMemberAvailabilityInput = {
  packCompanyId: string;
  /** synced | local — default local when null/unknown (owner-created rows). */
  membershipOrigin?: string | null;
  excluded?: boolean;
  product: UpstreamProductRow & { companyId: string };
  /** True when any upstream pack is soft / incomplete / cyclic. */
  upstreamChainSoft: boolean;
};

/** Walk immediate→root. Cycle or missing row → incomplete (fail closed). */
export function walkUpstreamPackIds(
  startId: string | null | undefined,
  byId: Map<string, UpstreamPackRow>,
): { ids: string[]; incomplete: boolean; cyclic: boolean } {
  const ids: string[] = [];
  let next = startId ?? null;
  const seen = new Set<string>();
  while (next) {
    if (seen.has(next)) {
      return { ids, incomplete: true, cyclic: true };
    }
    seen.add(next);
    const row = byId.get(next);
    if (!row) {
      return { ids, incomplete: true, cyclic: false };
    }
    ids.push(next);
    next = row.repostSourceCollectionId ?? null;
  }
  return { ids, incomplete: false, cyclic: false };
}

export type UpstreamChainSoftResult = {
  soft: boolean;
  /** Incomplete or cyclic — fail closed: omit whole pack even if locals exist. */
  failClosed: boolean;
};

/**
 * Upstream-chain soft for a pack with a source. Root packs are never soft here.
 */
export function upstreamChainSoftResult(
  pack: { repostSourceCollectionId?: string | null },
  byId: Map<string, UpstreamPackRow>,
  publishedStatus = 'published',
): UpstreamChainSoftResult {
  const sourceId = pack.repostSourceCollectionId ?? null;
  if (!sourceId) return { soft: false, failClosed: false };
  const walk = walkUpstreamPackIds(sourceId, byId);
  if (walk.incomplete || walk.cyclic) {
    return { soft: true, failClosed: true };
  }
  for (const id of walk.ids) {
    const row = byId.get(id);
    if (!row) return { soft: true, failClosed: true };
    if (row.status !== publishedStatus) return { soft: true, failClosed: false };
    if (!row.allowForward) return { soft: true, failClosed: false };
  }
  return { soft: false, failClosed: false };
}

/**
 * P1: a repost pack is soft-unavailable when any upstream pack in the chain
 * has allowForward off, is not published, or the lineage is incomplete/cyclic.
 * Root packs (no source) are never unavailable via this helper.
 *
 * Prefer {@link buyerShouldOmitRepostPack} for feed omit (mixed locals may stay).
 */
export function isRepostPackSoftUnavailable(
  pack: { repostSourceCollectionId?: string | null },
  byId: Map<string, UpstreamPackRow>,
  publishedStatus = 'published',
): boolean {
  return upstreamChainSoftResult(pack, byId, publishedStatus).soft;
}

/**
 * P2: a foreign product is soft-unavailable in a descendant when the product
 * itself has allowForward off (or is not published). Own-company products skip.
 */
export function isRepostProductSoftUnavailable(
  packCompanyId: string,
  product: UpstreamProductRow & { companyId: string },
  publishedStatus = 'published',
): boolean {
  if (product.companyId === packCompanyId) return false;
  if (product.status !== publishedStatus) return true;
  return !product.allowForward;
}

/**
 * Buyer-facing member availability (mixed packs).
 * Sticky excluded never eligible. Synced + upstream soft → unavailable.
 * Local / own-company stay unless product rules block (own unpublished still ok for owner surfaces — buyers use published filter elsewhere).
 */
export function isRepostMemberViewerUnavailable(
  input: RepostMemberAvailabilityInput,
  publishedStatus = 'published',
): boolean {
  if (input.excluded === true) return true;
  const origin =
    input.membershipOrigin === MembershipOrigin.Synced
      ? MembershipOrigin.Synced
      : MembershipOrigin.Local;
  const product = input.product;

  if (input.upstreamChainSoft && origin === MembershipOrigin.Synced) {
    return true;
  }
  // Synced foreign still respects product P2 when chain is fine.
  if (origin === MembershipOrigin.Synced || product.companyId !== input.packCompanyId) {
    return isRepostProductSoftUnavailable(input.packCompanyId, product, publishedStatus);
  }
  // Local own-company: only hide if product itself is not published for buyers.
  if (product.status !== publishedStatus) return true;
  return false;
}

/** Filter active members for buyer-facing surfaces (P2 + mixed upstream soft). */
export function filterViewerEligibleMembers<
  T extends {
    excluded?: boolean;
    membershipOrigin?: string | null;
    product: UpstreamProductRow & { companyId: string };
  },
>(
  packCompanyId: string,
  rows: T[],
  upstreamChainSoft: boolean,
  publishedStatus = 'published',
): T[] {
  return rows.filter(
    (row) =>
      !isRepostMemberViewerUnavailable(
        {
          packCompanyId,
          membershipOrigin: row.membershipOrigin,
          excluded: row.excluded === true,
          product: row.product,
          upstreamChainSoft,
        },
        publishedStatus,
      ),
  );
}

/** Filter active members for buyer-facing surfaces (P2 only — legacy). */
export function filterSoftAvailableProducts<
  T extends { product: UpstreamProductRow & { companyId: string } },
>(packCompanyId: string, rows: T[], publishedStatus = 'published'): T[] {
  return rows.filter(
    (row) =>
      !isRepostProductSoftUnavailable(packCompanyId, row.product, publishedStatus),
  );
}

/**
 * Whether buyers should omit the pack from Explore/shop/search.
 * Fail-closed lineage → always omit. Chain soft → omit only when zero eligible members.
 */
export function buyerShouldOmitRepostPack(input: {
  chain: UpstreamChainSoftResult;
  eligibleMemberCount: number;
}): boolean {
  if (!input.chain.soft) return false;
  if (input.chain.failClosed) return true;
  return input.eligibleMemberCount < 1;
}
