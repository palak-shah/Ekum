import { TradeLaneTicket } from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';

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
 * Share / follow change: keep Direct Links. They gray until mill Pack returns.
 * Trader × still deletes a lane in TradeLaneService.remove.
 */
export async function revokeAffectedDirectLinks(
  prisma: Prisma.TransactionClient,
  actorCompanyId: string,
  counterpartCompanyId: string,
): Promise<RevokeLaneRow[]> {
  return findAffectedDirectLinks(prisma, actorCompanyId, counterpartCompanyId);
}
