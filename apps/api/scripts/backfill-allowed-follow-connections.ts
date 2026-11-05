/**
 * One-shot: every Allowed follow gets an Active Connection (unless Blocked).
 * Idempotent. Run against local or live DATABASE_URL.
 *
 *   pnpm --filter @ekum/api exec tsx scripts/backfill-allowed-follow-connections.ts
 */
import { PrismaClient } from '@prisma/client';
import { backfillActiveConnectionsForAllowedFollows } from '../src/access/ensure-active-connection';

const prisma = new PrismaClient();

async function main() {
  const result = await backfillActiveConnectionsForAllowedFollows(prisma);
  console.log(
    `Allowed-follow connection backfill: examined=${result.examined} created=${result.created} alreadyActive=${result.alreadyActive} skippedBlocked=${result.skippedBlocked}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
