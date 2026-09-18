import { Prisma } from '@prisma/client';
import type { PrismaService } from '../core/prisma/prisma.service';

/**
 * Prisma `categories: { has: q }` is case-sensitive on Postgres String[].
 * Search elsewhere uses mode: 'insensitive'; tags must match the same way.
 */
export async function idsMatchingCategoryLabel(
  prisma: PrismaService,
  table: 'Collection' | 'Product',
  q: string,
): Promise<string[]> {
  const needle = q.trim();
  if (!needle) return [];

  const rows =
    table === 'Collection'
      ? await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT id FROM "Collection"
          WHERE EXISTS (
            SELECT 1 FROM unnest(categories) AS cat
            WHERE lower(cat) = lower(${needle})
          )
        `)
      : await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT id FROM "Product"
          WHERE EXISTS (
            SELECT 1 FROM unnest(categories) AS cat
            WHERE lower(cat) = lower(${needle})
          )
        `);

  return rows.map((row) => row.id);
}
