-- Direct links Network + auto-repost lineage (keep historical collections).

ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostRootCollectionId" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostOrigin" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostSyncedSourceAt" TIMESTAMP(3);
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostSyncedProductIds" JSONB;

ALTER TABLE "Thread" ADD COLUMN IF NOT EXISTS "messagingClosedAt" TIMESTAMP(3);

-- Historical source-linked packs stay manual (independent curation).
UPDATE "Collection"
SET "repostOrigin" = 'manual'
WHERE ("repostSourceCollectionId" IS NOT NULL OR "repostSourceProductId" IS NOT NULL)
  AND "repostOrigin" IS NULL;

-- Stamp immediate source as a first-pass root, then walk parents.
UPDATE "Collection"
SET "repostRootCollectionId" = "repostSourceCollectionId"
WHERE "repostSourceCollectionId" IS NOT NULL
  AND "repostRootCollectionId" IS NULL;

-- Repeat a bounded number of hops so chains collapse to the mill original.
UPDATE "Collection" AS child
SET "repostRootCollectionId" = parent."repostRootCollectionId"
FROM "Collection" AS parent
WHERE child."repostRootCollectionId" = parent.id
  AND parent."repostRootCollectionId" IS NOT NULL
  AND parent."repostRootCollectionId" <> parent.id;

UPDATE "Collection" AS child
SET "repostRootCollectionId" = parent."repostRootCollectionId"
FROM "Collection" AS parent
WHERE child."repostRootCollectionId" = parent.id
  AND parent."repostRootCollectionId" IS NOT NULL
  AND parent."repostRootCollectionId" <> parent.id;

UPDATE "Collection" AS child
SET "repostRootCollectionId" = parent."repostRootCollectionId"
FROM "Collection" AS parent
WHERE child."repostRootCollectionId" = parent.id
  AND parent."repostRootCollectionId" IS NOT NULL
  AND parent."repostRootCollectionId" <> parent.id;

CREATE INDEX IF NOT EXISTS "Collection_companyId_repostRootCollectionId_idx"
  ON "Collection"("companyId", "repostRootCollectionId");

-- New automatic packs only. Duplicate historical manuals are kept (no deletes).
CREATE UNIQUE INDEX IF NOT EXISTS "Collection_companyId_repostRoot_automatic_key"
  ON "Collection"("companyId", "repostRootCollectionId")
  WHERE "repostOrigin" = 'automatic' AND "repostRootCollectionId" IS NOT NULL;
