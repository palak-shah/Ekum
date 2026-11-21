/**
 * Repost CollectionProduct provenance + exclusion transitions (Batch 1).
 * Only explicit owner re-add clears excluded; source churn never does.
 */

export const MembershipOrigin = {
  Synced: 'synced',
  Local: 'local',
} as const;
export type MembershipOrigin = (typeof MembershipOrigin)[keyof typeof MembershipOrigin];

export type RepostMembershipRow = {
  productId: string;
  membershipOrigin: MembershipOrigin | null;
  excluded: boolean;
  explicitlyAddedAt?: Date | string | null;
};

export type RepostMembershipWrite = {
  productId: string;
  position: number;
  membershipOrigin: MembershipOrigin;
  excluded: boolean;
  explicitlyAddedAt: Date | null;
};

function asOrigin(value: string | null | undefined): MembershipOrigin {
  return value === MembershipOrigin.Synced ? MembershipOrigin.Synced : MembershipOrigin.Local;
}

/**
 * Owner setProducts on a repost pack: desired ids are the active (visible) set.
 * Omitting a synced member → exclusion tombstone. Re-including an excluded id → clear exclusion.
 */
export function applyOwnerSetProductsToMembership(input: {
  previous: RepostMembershipRow[];
  desiredProductIds: string[];
  sourceProductIds: string[];
  now?: Date;
}): RepostMembershipWrite[] {
  const now = input.now ?? new Date();
  const sourceSet = new Set(input.sourceProductIds);
  const desired = [...new Set(input.desiredProductIds)];
  const desiredSet = new Set(desired);
  const prevById = new Map(input.previous.map((row) => [row.productId, row]));

  const out: RepostMembershipWrite[] = [];

  for (const productId of desired) {
    const prev = prevById.get(productId);
    const origin = sourceSet.has(productId) ? MembershipOrigin.Synced : MembershipOrigin.Local;
    if (prev?.excluded) {
      out.push({
        productId,
        position: out.length,
        membershipOrigin: origin,
        excluded: false,
        explicitlyAddedAt: now,
      });
      continue;
    }
    out.push({
      productId,
      position: out.length,
      membershipOrigin: prev ? asOrigin(prev.membershipOrigin) : origin,
      excluded: false,
      explicitlyAddedAt: prev?.explicitlyAddedAt
        ? new Date(prev.explicitlyAddedAt)
        : null,
    });
  }

  for (const prev of input.previous) {
    if (desiredSet.has(prev.productId)) continue;
    if (prev.excluded) {
      out.push({
        productId: prev.productId,
        position: out.length,
        membershipOrigin: asOrigin(prev.membershipOrigin),
        excluded: true,
        explicitlyAddedAt: prev.explicitlyAddedAt
          ? new Date(prev.explicitlyAddedAt)
          : null,
      });
      continue;
    }
    const origin = asOrigin(prev.membershipOrigin);
    if (origin === MembershipOrigin.Synced) {
      out.push({
        productId: prev.productId,
        position: out.length,
        membershipOrigin: MembershipOrigin.Synced,
        excluded: true,
        explicitlyAddedAt: null,
      });
    }
    // local non-excluded omitted → dropped
  }

  return out.map((row, position) => ({ ...row, position }));
}

/**
 * Source-driven sync into a repost child. Never clears excluded.
 * Keeps local extras; drops non-excluded synced members that left the source.
 */
export function applySourceSyncToMembership(input: {
  previous: RepostMembershipRow[];
  sourceProductIds: string[];
  /** Product ids last stamped as synced from source (watermark list). */
  previouslySyncedProductIds: string[];
}): RepostMembershipWrite[] {
  const sourceIds = [...new Set(input.sourceProductIds)];
  const sourceSet = new Set(sourceIds);
  const prevSynced = new Set(input.previouslySyncedProductIds);
  const prevById = new Map(input.previous.map((row) => [row.productId, row]));

  const out: RepostMembershipWrite[] = [];
  const seen = new Set<string>();

  for (const productId of sourceIds) {
    const prev = prevById.get(productId);
    if (prev?.excluded) {
      out.push({
        productId,
        position: out.length,
        membershipOrigin: MembershipOrigin.Synced,
        excluded: true,
        explicitlyAddedAt: prev.explicitlyAddedAt
          ? new Date(prev.explicitlyAddedAt)
          : null,
      });
      seen.add(productId);
      continue;
    }
    out.push({
      productId,
      position: out.length,
      membershipOrigin: MembershipOrigin.Synced,
      excluded: false,
      explicitlyAddedAt: prev?.explicitlyAddedAt
        ? new Date(prev.explicitlyAddedAt)
        : null,
    });
    seen.add(productId);
  }

  for (const prev of input.previous) {
    if (seen.has(prev.productId)) continue;
    if (prev.excluded) {
      out.push({
        productId: prev.productId,
        position: out.length,
        membershipOrigin: asOrigin(prev.membershipOrigin),
        excluded: true,
        explicitlyAddedAt: prev.explicitlyAddedAt
          ? new Date(prev.explicitlyAddedAt)
          : null,
      });
      seen.add(prev.productId);
      continue;
    }
    const origin = asOrigin(prev.membershipOrigin);
    const wasSynced = origin === MembershipOrigin.Synced || prevSynced.has(prev.productId);
    if (wasSynced && !sourceSet.has(prev.productId)) {
      // Left the source and was not excluded → drop
      continue;
    }
    // Local extra (or unknown) → keep
    out.push({
      productId: prev.productId,
      position: out.length,
      membershipOrigin: MembershipOrigin.Local,
      excluded: false,
      explicitlyAddedAt: prev.explicitlyAddedAt
        ? new Date(prev.explicitlyAddedAt)
        : null,
    });
    seen.add(prev.productId);
  }

  return out.map((row, position) => ({ ...row, position }));
}

/** Active (non-excluded) product ids in position order. */
export function activeRepostProductIds(rows: Array<{ productId: string; excluded: boolean }>): string[] {
  return rows.filter((row) => !row.excluded).map((row) => row.productId);
}

/**
 * After a locked re-read of membership, force any exclusion tombstones to survive
 * a stale source-sync compute (owner exclude raced ahead of sync's pre-lock plan).
 */
export function forcePreserveExclusions(
  writeRows: RepostMembershipWrite[],
  lockedPrevious: RepostMembershipRow[],
): RepostMembershipWrite[] {
  const excludedIds = new Set(
    lockedPrevious.filter((row) => row.excluded).map((row) => row.productId),
  );
  if (excludedIds.size === 0) return writeRows;
  return writeRows.map((row) =>
    excludedIds.has(row.productId) ? { ...row, excluded: true } : row,
  );
}
