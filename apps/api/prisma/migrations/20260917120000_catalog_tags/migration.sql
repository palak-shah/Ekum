-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "CatalogTag" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "companyId" TEXT,
    "label" TEXT NOT NULL,
    "parentKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'verified',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogTag_companyId_idx" ON "CatalogTag"("companyId");

-- CreateIndex
CREATE INDEX "CatalogTag_scope_parentKey_idx" ON "CatalogTag"("scope", "parentKey");

-- CreateIndex
CREATE INDEX "CatalogTag_scope_status_idx" ON "CatalogTag"("scope", "status");

-- Company custom tags: unique on (companyId, lower(label))
CREATE UNIQUE INDEX "CatalogTag_company_label_ci_key"
ON "CatalogTag" ("companyId", lower("label"))
WHERE "companyId" IS NOT NULL;

-- Official tags: unique on (parentKey, lower(label)) so Shirt can exist under MENS/WOMENS/KIDS
CREATE UNIQUE INDEX "CatalogTag_official_parent_label_ci_key"
ON "CatalogTag" ("parentKey", lower("label"))
WHERE "companyId" IS NULL AND "parentKey" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "CatalogTag" ADD CONSTRAINT "CatalogTag_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
