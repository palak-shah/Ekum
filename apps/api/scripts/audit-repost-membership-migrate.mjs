/**
 * Non-destructive Batch 1.1 migration audit (watermark orphan cleanup).
 * Does not DELETE or APPLY migrations — SELECT only.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CollectionProduct'
      AND column_name IN ('membershipOrigin', 'excluded', 'explicitlyAddedAt')
    ORDER BY column_name
  `);
  console.log('columns', JSON.stringify(cols));

  const hasMembership =
    Array.isArray(cols) && cols.some((row) => row.column_name === 'membershipOrigin');

  if (!hasMembership) {
    console.log(
      JSON.stringify(
        {
          status: 'columns_absent',
          note: 'Migration 20261120120000 not applied yet. Candidate counts use projected post-backfill logic against current source membership + watermarks.',
        },
        null,
        2,
      ),
    );
  }

  // Projected "would become local" members: on child, not on immediate source (source-linked packs).
  const wouldBeLocal = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS n
    FROM "CollectionProduct" cp
    JOIN "Collection" c ON c.id = cp."collectionId"
    WHERE c."repostSourceCollectionId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "CollectionProduct" sp
        WHERE sp."collectionId" = c."repostSourceCollectionId"
          AND sp."productId" = cp."productId"
      )
  `);

  // Watermark orphan DELETE candidates: on child, in watermark, not on immediate source.
  // (Pre-migrate = projected; post-migrate migration also requires membershipOrigin local/null.)
  const deleteCandidates = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS n
    FROM "CollectionProduct" cp
    JOIN "Collection" c ON c.id = cp."collectionId"
    WHERE c."repostSourceCollectionId" IS NOT NULL
      AND c."repostSyncedProductIds" IS NOT NULL
      AND jsonb_typeof(c."repostSyncedProductIds"::jsonb) = 'array'
      AND c."repostSyncedProductIds"::jsonb ? cp."productId"
      AND NOT EXISTS (
        SELECT 1 FROM "CollectionProduct" sp
        WHERE sp."collectionId" = c."repostSourceCollectionId"
          AND sp."productId" = cp."productId"
      )
  `);

  // Retained as local: not on source, not in watermark (true extras) OR no watermark.
  const retainedLocal = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS n
    FROM "CollectionProduct" cp
    JOIN "Collection" c ON c.id = cp."collectionId"
    WHERE c."repostSourceCollectionId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "CollectionProduct" sp
        WHERE sp."collectionId" = c."repostSourceCollectionId"
          AND sp."productId" = cp."productId"
      )
      AND (
        c."repostSyncedProductIds" IS NULL
        OR jsonb_typeof(c."repostSyncedProductIds"::jsonb) <> 'array'
        OR NOT (c."repostSyncedProductIds"::jsonb ? cp."productId")
      )
  `);

  // Excluded protected (only meaningful after migration columns exist).
  let excludedProtected = [{ n: 0 }];
  if (hasMembership) {
    excludedProtected = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS n
      FROM "CollectionProduct" cp
      WHERE cp."excluded" = true
    `);
  }

  const sampleDelete = await prisma.$queryRawUnsafe(`
    SELECT c.id AS collection_id, c."companyId" AS company_id,
           c."repostSourceCollectionId" AS source_id, cp."productId" AS product_id,
           c."repostSyncedProductIds" AS watermark
    FROM "CollectionProduct" cp
    JOIN "Collection" c ON c.id = cp."collectionId"
    WHERE c."repostSourceCollectionId" IS NOT NULL
      AND c."repostSyncedProductIds" IS NOT NULL
      AND jsonb_typeof(c."repostSyncedProductIds"::jsonb) = 'array'
      AND c."repostSyncedProductIds"::jsonb ? cp."productId"
      AND NOT EXISTS (
        SELECT 1 FROM "CollectionProduct" sp
        WHERE sp."collectionId" = c."repostSourceCollectionId"
          AND sp."productId" = cp."productId"
      )
    LIMIT 10
  `);

  const sampleRetained = await prisma.$queryRawUnsafe(`
    SELECT c.id AS collection_id, cp."productId" AS product_id,
           c."repostSyncedProductIds" IS NULL AS no_watermark
    FROM "CollectionProduct" cp
    JOIN "Collection" c ON c.id = cp."collectionId"
    WHERE c."repostSourceCollectionId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "CollectionProduct" sp
        WHERE sp."collectionId" = c."repostSourceCollectionId"
          AND sp."productId" = cp."productId"
      )
      AND (
        c."repostSyncedProductIds" IS NULL
        OR jsonb_typeof(c."repostSyncedProductIds"::jsonb) <> 'array'
        OR NOT (c."repostSyncedProductIds"::jsonb ? cp."productId")
      )
    LIMIT 10
  `);

  const totalSourceLinkedMembers = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS n
    FROM "CollectionProduct" cp
    JOIN "Collection" c ON c.id = cp."collectionId"
    WHERE c."repostSourceCollectionId" IS NOT NULL
       OR c."repostSourceProductId" IS NOT NULL
  `);

  console.log(
    JSON.stringify(
      {
        status: hasMembership ? 'columns_present' : 'columns_absent_projected',
        totalSourceLinkedMembers: totalSourceLinkedMembers[0]?.n ?? 0,
        wouldBeLocalOrAlreadyLocal: wouldBeLocal[0]?.n ?? 0,
        proposedDeleteWatermarkOrphans: deleteCandidates[0]?.n ?? 0,
        retainedAsLocalExtras: retainedLocal[0]?.n ?? 0,
        excludedRowsProtected: excludedProtected[0]?.n ?? 0,
        sampleDeleteCandidates: sampleDelete,
        sampleRetainedLocal: sampleRetained,
        ambiguous:
          'Manuals with null watermark that left the source stay retained-local forever; cannot auto-distinguish former sync without watermark.',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error('audit-failed', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
