-- Platform admin flag
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Company master categories (replace SuperCategory semantics)
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "masterCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Collection classification
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "masterCategoryId" TEXT;

-- MasterCategory
CREATE TABLE IF NOT EXISTS "MasterCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MasterCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MasterCategory_slug_key" ON "MasterCategory"("slug");

-- MasterOption
CREATE TABLE IF NOT EXISTS "MasterOption" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MasterOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MasterOption_kind_active_idx" ON "MasterOption"("kind", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "MasterOption_kind_label_key" ON "MasterOption"("kind", "label");
CREATE UNIQUE INDEX IF NOT EXISTS "MasterOption_kind_lower_label_key" ON "MasterOption"("kind", lower("label"));

-- MasterOptionLink
CREATE TABLE IF NOT EXISTS "MasterOptionLink" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    CONSTRAINT "MasterOptionLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MasterOptionLink_categoryId_optionId_key" ON "MasterOptionLink"("categoryId", "optionId");
CREATE INDEX IF NOT EXISTS "MasterOptionLink_optionId_idx" ON "MasterOptionLink"("optionId");

-- CategoryUnit
CREATE TABLE IF NOT EXISTS "CategoryUnit" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    CONSTRAINT "CategoryUnit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CategoryUnit_categoryId_unit_key" ON "CategoryUnit"("categoryId", "unit");

-- CompanyCustomTag
CREATE TABLE IF NOT EXISTS "CompanyCustomTag" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "masterCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyCustomTag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CompanyCustomTag_companyId_kind_idx" ON "CompanyCustomTag"("companyId", "kind");
CREATE INDEX IF NOT EXISTS "CompanyCustomTag_masterCategoryId_idx" ON "CompanyCustomTag"("masterCategoryId");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyCustomTag_company_kind_cat_lower_label_key"
  ON "CompanyCustomTag"("companyId", "kind", COALESCE("masterCategoryId", ''), lower("label"));

-- FKs
DO $$ BEGIN
  ALTER TABLE "MasterOptionLink" ADD CONSTRAINT "MasterOptionLink_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "MasterCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MasterOptionLink" ADD CONSTRAINT "MasterOptionLink_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "MasterOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CategoryUnit" ADD CONSTRAINT "CategoryUnit_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "MasterCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyCustomTag" ADD CONSTRAINT "CompanyCustomTag_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyCustomTag" ADD CONSTRAINT "CompanyCustomTag_masterCategoryId_fkey"
    FOREIGN KEY ("masterCategoryId") REFERENCES "MasterCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Collection" ADD CONSTRAINT "Collection_masterCategoryId_fkey"
    FOREIGN KEY ("masterCategoryId") REFERENCES "MasterCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Collection_masterCategoryId_idx" ON "Collection"("masterCategoryId");

-- Migrate legacy SuperCategory → masterCategories (best-effort expand)
UPDATE "Company" c
SET "masterCategories" = sub.slugs
FROM (
  SELECT
    c2.id,
    COALESCE((
      SELECT array_agg(DISTINCT m.slug)
      FROM unnest(c2."superCategories") AS s(raw)
      CROSS JOIN LATERAL (
        SELECT unnest(
          CASE raw
            WHEN 'mens_apparel' THEN ARRAY['mens_readymade_ethnic','mens_readymade_western']
            WHEN 'womens_apparel' THEN ARRAY['womens_readymade_ethnic','womens_readymade_western','womens_unstitched']
            WHEN 'home_furnishing' THEN ARRAY['hometextiles_readyset','hometextiles_fabric']
            WHEN 'accessories' THEN ARRAY['accessories_readymade']
            WHEN 'others' THEN ARRAY[]::TEXT[]
            ELSE ARRAY[raw]
          END
        ) AS slug
      ) m
      WHERE m.slug IS NOT NULL AND m.slug <> ''
    ), ARRAY[]::TEXT[]) AS slugs
  FROM "Company" c2
) sub
WHERE c.id = sub.id
  AND cardinality(c."masterCategories") = 0
  AND cardinality(c."superCategories") > 0;
