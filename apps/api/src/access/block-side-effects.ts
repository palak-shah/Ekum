import type { Prisma } from '@prisma/client';
import { revokeAffectedDirectLinks } from '../orders/trade-lane-revoke';

type Tx = Prisma.TransactionClient;

/** Block: revoke Direct Links and delete both Follow directions (not Stopped — gone). */
export async function applyBlockSideEffects(
  tx: Tx,
  companyId: string,
  otherCompanyId: string,
): Promise<void> {
  await revokeAffectedDirectLinks(tx, companyId, otherCompanyId);
  await tx.follow.deleteMany({
    where: {
      OR: [
        { followerCompanyId: companyId, followedCompanyId: otherCompanyId },
        { followerCompanyId: otherCompanyId, followedCompanyId: companyId },
      ],
    },
  });
}
