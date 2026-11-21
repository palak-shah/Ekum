/**
 * Full-chain credit hop loader — no depth cap; cycles skipped via byId.
 * Incomplete chains: sourceHopChainIncomplete in source-shop-credit.ts.
 */
import type { PrismaService } from '../core/prisma/prisma.service';
import { withRepostHopPerf } from '../catalog/repost-hop-instrument';
import {
  sourceHopChainIncomplete,
  sourceHopsFromRows,
  type SourceCreditHopRow,
} from './source-shop-credit';

export type { SourceCreditHopRow };
export { sourceHopChainIncomplete };

/**
 * Load every ancestor pack for the given source ids (BFS, unbounded).
 * Already-seen ids are not re-fetched (cycle-safe).
 */
export async function loadSourceCreditHopRows(
  prisma: PrismaService,
  sourceIds: Array<string | null | undefined>,
): Promise<Map<string, SourceCreditHopRow>> {
  const roots = [...new Set(sourceIds.filter((id): id is string => Boolean(id)))];
  return withRepostHopPerf('lineage_credit', async (note) => {
    const byId = new Map<string, SourceCreditHopRow>();
    let pending = roots;
    let queryRounds = 0;
    let missing = false;

    while (pending.length > 0) {
      queryRounds += 1;
      const hopRows = await prisma.collection.findMany({
        where: { id: { in: pending } },
        select: {
          id: true,
          companyId: true,
          showSourceShops: true,
          repostSourceCollectionId: true,
          company: { select: { name: true } },
        },
      });
      const next: string[] = [];
      const found = new Set<string>();
      for (const row of hopRows) {
        found.add(row.id);
        byId.set(row.id, {
          companyId: row.companyId,
          companyName: row.company.name,
          showSourceShops: row.showSourceShops === true,
          repostSourceCollectionId: row.repostSourceCollectionId,
        });
        if (
          row.repostSourceCollectionId &&
          !byId.has(row.repostSourceCollectionId)
        ) {
          next.push(row.repostSourceCollectionId);
        }
      }
      // Missing ids requested but not found → leave absent so incomplete fails closed.
      if (pending.some((id) => !found.has(id))) missing = true;
      pending = next;
    }
    note({
      hopCount: byId.size,
      queryRounds,
      packCount: roots.length,
      failure: missing ? 'incomplete_chain' : 'none',
    });
    return byId;
  });
}

export function hopsForSource(
  sourceId: string | null | undefined,
  byId: Map<string, SourceCreditHopRow>,
) {
  return sourceHopsFromRows(sourceId, byId);
}
