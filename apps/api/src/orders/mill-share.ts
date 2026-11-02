import type { Prisma } from '@prisma/client';
import { FollowAccessKind, FollowStatus, isPackFollow } from '../discovery/follow-access';

type FollowDb = Pick<Prisma.TransactionClient, 'follow'>;

export async function millShareActive(
  prisma: FollowDb,
  traderCompanyId: string,
  millCompanyId: string,
): Promise<boolean> {
  const row = await prisma.follow.findUnique({
    where: {
      followerCompanyId_followedCompanyId: {
        followerCompanyId: traderCompanyId,
        followedCompanyId: millCompanyId,
      },
    },
    select: { status: true, accessKind: true },
  });
  return isPackFollow(row);
}

export async function millShareActiveSet(
  prisma: FollowDb,
  traderCompanyId: string,
  millCompanyIds: string[],
): Promise<Set<string>> {
  const ids = [...new Set(millCompanyIds.filter(Boolean))];
  if (ids.length === 0) return new Set();
  const rows = await prisma.follow.findMany({
    where: {
      followerCompanyId: traderCompanyId,
      followedCompanyId: { in: ids },
      status: FollowStatus.Allowed,
      accessKind: FollowAccessKind.Pack,
    },
    select: { followedCompanyId: true },
  });
  return new Set(rows.map((row) => row.followedCompanyId));
}
