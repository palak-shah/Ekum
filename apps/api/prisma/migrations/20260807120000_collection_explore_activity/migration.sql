-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "exploreActivityAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Collection_exploreActivityAt_idx" ON "Collection"("exploreActivityAt");

-- Backfill: published collections use createdAt as initial activity time
UPDATE "Collection"
SET "exploreActivityAt" = "createdAt"
WHERE "status" = 'published' AND "exploreActivityAt" IS NULL;
