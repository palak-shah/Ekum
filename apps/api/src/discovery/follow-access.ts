export const FollowStatus = {
  Pending: 'pending',
  Allowed: 'allowed',
} as const;

export const FollowAccessKind = {
  Look: 'look',
  Pack: 'pack',
} as const;

/** Prisma filter: this viewer is an allowed follower of the post owner. */
export function allowedFollowSome(followerCompanyId: string) {
  return { some: { followerCompanyId, status: FollowStatus.Allowed } };
}

export function allowedFollowWhere(followerCompanyId: string, followedCompanyId?: string) {
  return {
    followerCompanyId,
    ...(followedCompanyId ? { followedCompanyId } : {}),
    status: FollowStatus.Allowed,
  };
}

export function isAllowedFollow(row: { status: string } | null | undefined): boolean {
  return row?.status === FollowStatus.Allowed;
}

export function isPackFollow(
  row: { status: string; accessKind: string | null } | null | undefined,
): boolean {
  return row?.status === FollowStatus.Allowed && row.accessKind === FollowAccessKind.Pack;
}

/** Look-only (not Connected) must not curate that seller. */
export function isLookOnlyFollowBlock(opts: {
  connected: boolean;
  follow: { status: string; accessKind: string | null } | null | undefined;
}): boolean {
  if (opts.connected) return false;
  return isAllowedFollow(opts.follow) && !isPackFollow(opts.follow);
}
