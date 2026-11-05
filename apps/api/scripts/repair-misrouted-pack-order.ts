/**
 * One-shot: re-home the open Buyer 1 → Supplier 1 ticket that was placed from
 * a design inside Trader 1's pack. Other trios are not touched.
 *
 *   pnpm --filter @ekum/api exec tsx scripts/repair-misrouted-pack-order.ts
 */
import { PrismaClient } from '@prisma/client';
import { repairMisroutedPackOrders } from '../src/orders/repair-misrouted-pack-order';

const prisma = new PrismaClient();

async function main() {
  const result = await repairMisroutedPackOrders(prisma);
  console.log(
    `Misrouted pack repair: repaired=${result.repaired.join(',') || 'none'} skipped=${result.skipped.map((row) => `${row.id}:${row.reason}`).join(',') || 'none'}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
