-- Explore Repost: stamp source post on the pack created under my name.
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostSourceCollectionId" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostSourceProductId" TEXT;

CREATE INDEX IF NOT EXISTS "Collection_companyId_repostSourceCollectionId_idx"
  ON "Collection"("companyId", "repostSourceCollectionId");
CREATE INDEX IF NOT EXISTS "Collection_companyId_repostSourceProductId_idx"
  ON "Collection"("companyId", "repostSourceProductId");

-- One repost per owner + source post.
CREATE UNIQUE INDEX IF NOT EXISTS "Collection_companyId_repostSourceCollectionId_key"
  ON "Collection"("companyId", "repostSourceCollectionId")
  WHERE "repostSourceCollectionId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Collection_companyId_repostSourceProductId_key"
  ON "Collection"("companyId", "repostSourceProductId")
  WHERE "repostSourceProductId" IS NOT NULL;
