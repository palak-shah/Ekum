import type { Prisma } from '@prisma/client';
import { ProfileVisibility } from '@ekum/domain-types';

export const FollowStatus = {
  Pending: 'pending',
  Allowed: 'allowed',
  Stopped: 'stopped',
} as const;

export const FollowAccessKind = {
  Look: 'look',
  Pack: 'pack',
} as const;

/** Prisma filter: this viewer is an allowed follower of the post owner. */
export function allowedFollowSome(followerCompanyId: string) {
  return { some: { followerCompanyId, status: FollowStatus.Allowed } };
}

/**
 * Companies the viewer may discover as businesses: Public, or Private with an
 * approved Follow. Does not grant collection audience or phone access.
 */
export function discoverableProfileWhere(
  viewerCompanyId: string,
): Prisma.CompanyWhereInput {
  return {
    OR: [
      { profileVisibility: ProfileVisibility.Public },
      { followers: allowedFollowSome(viewerCompanyId) },
    ],
  };
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

/** Allowed look follow must not curate that seller (Connection does not unlock). */
export function isLookOnlyFollowBlock(opts: {
  connected?: boolean;
  follow: { status: string; accessKind: string | null } | null | undefined;
}): boolean {
  return isAllowedFollow(opts.follow) && !isPackFollow(opts.follow);
}
