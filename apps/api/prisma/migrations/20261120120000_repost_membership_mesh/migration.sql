-- Batch 1: membership provenance/exclusions + drop root automatic unique (mesh).
--
-- ONE-SHOT BACKFILL: Do NOT re-run the UPDATE blocks below after exclusions exist.
-- Re-running would mis-stamp origins against source rows that may now be excluded
-- tombstones. Apply this migration once per database.

ALTER TABLE "CollectionProduct" ADD COLUMN IF NOT EXISTS "membershipOrigin" TEXT;
ALTER TABLE "CollectionProduct" ADD COLUMN IF NOT EXISTS "excluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CollectionProduct" ADD COLUMN IF NOT EXISTS "explicitlyAddedAt" TIMESTAMP(3);

-- Immediate-source members → synced (source membership at migrate time; all excluded=false).
UPDATE "CollectionProduct" AS cp
SET "membershipOrigin" = 'synced',
    "excluded" = false
FROM "Collection" AS c
WHERE cp."collectionId" = c.id
  AND c."repostSourceCollectionId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "CollectionProduct" AS sp
    WHERE sp."collectionId" = c."repostSourceCollectionId"
      AND sp."productId" = cp."productId"
  );

-- Solo-design source → that design is synced.
UPDATE "CollectionProduct" AS cp
SET "membershipOrigin" = 'synced',
    "excluded" = false
FROM "Collection" AS c
WHERE cp."collectionId" = c.id
  AND c."repostSourceProductId" IS NOT NULL
  AND cp."productId" = c."repostSourceProductId";

-- Remaining members on source-linked packs → local extras.
UPDATE "CollectionProduct" AS cp
SET "membershipOrigin" = 'local',
    "excluded" = false
FROM "Collection" AS c
WHERE cp."collectionId" = c.id
  AND (c."repostSourceCollectionId" IS NOT NULL OR c."repostSourceProductId" IS NOT NULL)
  AND cp."membershipOrigin" IS NULL;

-- M6: watermark evidence — former synced members no longer on immediate source would
-- otherwise become sticky "local" extras. Drop those rows when the JSON watermark lists them.
-- (repostSyncedProductIds is Json array of product id strings when present.)
DELETE FROM "CollectionProduct" AS cp
USING "Collection" AS c
WHERE cp."collectionId" = c.id
  AND c."repostSourceCollectionId" IS NOT NULL
  AND c."repostSyncedProductIds" IS NOT NULL
  AND jsonb_typeof(c."repostSyncedProductIds"::jsonb) = 'array'
  AND c."repostSyncedProductIds"::jsonb ? cp."productId"
  AND cp."membershipOrigin" = 'local'
  AND NOT EXISTS (
    SELECT 1
    FROM "CollectionProduct" AS sp
    WHERE sp."collectionId" = c."repostSourceCollectionId"
      AND sp."productId" = cp."productId"
  );

CREATE INDEX IF NOT EXISTS "CollectionProduct_collectionId_excluded_idx"
  ON "CollectionProduct"("collectionId", "excluded");

-- Mesh: one pack per immediate source, not per root. Keep the non-unique root index.
-- M5: Does NOT auto-delete historical root-collapsed duplicates — audit only (see
-- docs/superpowers/ops/2026-11-20-repost-batch1-migration-audit.md).
DROP INDEX IF EXISTS "Collection_companyId_repostRoot_automatic_key";
