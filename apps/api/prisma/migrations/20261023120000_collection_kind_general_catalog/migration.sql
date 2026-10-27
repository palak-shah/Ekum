-- Collection kind (general | regular | catalog) and catalog order mode.
-- Product.catalogCollectionId enforces owner-scoped catalog exclusivity.
-- One General Collection per company (identity is kind, never name).
-- Ready collections become Draft. No hard deletes.

ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "orderMode" TEXT;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "catalogCollectionId" TEXT;

CREATE INDEX IF NOT EXISTS "Collection_companyId_kind_idx"
  ON "Collection"("companyId", "kind");

CREATE INDEX IF NOT EXISTS "Product_catalogCollectionId_idx"
  ON "Product"("catalogCollectionId");

-- One general collection per company.
CREATE UNIQUE INDEX IF NOT EXISTS "Collection_companyId_general_key"
  ON "Collection"("companyId")
  WHERE "kind" = 'general';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_catalogCollectionId_fkey'
  ) THEN
    ALTER TABLE "Product"
      ADD CONSTRAINT "Product_catalogCollectionId_fkey"
      FOREIGN KEY ("catalogCollectionId") REFERENCES "Collection"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Offline leftover: Ready is no longer a product status.
UPDATE "Collection" SET "status" = 'draft' WHERE "status" = 'ready';

-- Backfill one General Collection per company. Retry-safe: unique on kind=general.
INSERT INTO "Collection" (
  "id",
  "companyId",
  "name",
  "kind",
  "status",
  "audience",
  "rateVisibility",
  "allowForward",
  "allowDownload",
  "exploreNewDesignCount",
  "showSourceShops",
  "categories",
  "audienceCompanyIds",
  "audienceGroupIds",
  "createdAt",
  "updatedAt"
)
SELECT
  'gc_' || c."id",
  c."id",
  CASE
    WHEN EXISTS (
      SELECT 1 FROM "Collection" x
      WHERE x."companyId" = c."id"
        AND lower(x."name") = 'general collection'
        AND x."status" <> 'archived'
        AND x."kind" <> 'general'
    ) THEN 'General Collection · library'
    ELSE 'General Collection'
  END,
  'general',
  'published',
  'followers',
  'on_request',
  true,
  false,
  0,
  false,
  ARRAY[]::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NOW(),
  NOW()
FROM "Company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "Collection" g
  WHERE g."companyId" = c."id" AND g."kind" = 'general'
);
