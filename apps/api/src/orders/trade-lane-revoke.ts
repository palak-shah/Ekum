import { TradeLaneTicket } from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';
import { removeDirectLinkBuyersForLanes } from '../catalog/direct-link-repost-audience';

export type RevokeLaneRow = {
  id: string;
  traderCompanyId: string;
  sellerCompanyId: string;
  buyerCompanyId: string;
  groupThreadId: string | null;
  seller: { id: string; name: string };
  buyer: { id: string; name: string };
  ticket: string;
  reveal: boolean;
  behaviors?: unknown;
  updatedAt: Date;
};

const laneInclude = {
  seller: { select: { id: true, name: true } },
  buyer: { select: { id: true, name: true } },
} as const;

/** Direct Links that a follow/unfollow or remove-follower would invalidate. */
export function affectedDirectLinkWhere(
  actorCompanyId: string,
  counterpartCompanyId: string,
): Prisma.TradeLaneWhereInput {
  return {
    ticket: TradeLaneTicket.Mill,
    OR: [
      { traderCompanyId: actorCompanyId, sellerCompanyId: counterpartCompanyId },
      { traderCompanyId: actorCompanyId, buyerCompanyId: counterpartCompanyId },
      { traderCompanyId: counterpartCompanyId, buyerCompanyId: actorCompanyId },
    ],
  };
}

export async function findAffectedDirectLinks(
  prisma: Prisma.TransactionClient,
  actorCompanyId: string,
  counterpartCompanyId: string,
): Promise<RevokeLaneRow[]> {
  return prisma.tradeLane.findMany({
    where: affectedDirectLinkWhere(actorCompanyId, counterpartCompanyId),
    include: laneInclude,
  });
}

/**
 * Close only each lane's stored trio, then delete the lane.
 * Existing orders, 1:1 chats, and other groups are untouched.
 */
export async function revokeAffectedDirectLinks(
  prisma: Prisma.TransactionClient,
  actorCompanyId: string,
  counterpartCompanyId: string,
): Promise<RevokeLaneRow[]> {
  const lanes = await findAffectedDirectLinks(prisma, actorCompanyId, counterpartCompanyId);
  const closedAt = new Date();
  const threadIds = [
    ...new Set(lanes.map((lane) => lane.groupThreadId).filter((id): id is string => Boolean(id))),
  ];
  if (threadIds.length > 0) {
    await prisma.thread.updateMany({
      where: { id: { in: threadIds }, messagingClosedAt: null },
      data: { messagingClosedAt: closedAt },
    });
  }
  if (lanes.length > 0) {
    await prisma.tradeLane.deleteMany({
      where: { id: { in: lanes.map((lane) => lane.id) } },
    });
    await removeDirectLinkBuyersForLanes(prisma, lanes);
  }
  return lanes;
}
