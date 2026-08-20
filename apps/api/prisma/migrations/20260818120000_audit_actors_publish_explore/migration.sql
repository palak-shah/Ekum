-- Staff audit actors on catalog + orders
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "Product_createdByUserId_idx" ON "Product"("createdByUserId");
CREATE INDEX IF NOT EXISTS "Product_updatedByUserId_idx" ON "Product"("updatedByUserId");
CREATE INDEX IF NOT EXISTS "Collection_createdByUserId_idx" ON "Collection"("createdByUserId");
CREATE INDEX IF NOT EXISTS "Collection_updatedByUserId_idx" ON "Collection"("updatedByUserId");
CREATE INDEX IF NOT EXISTS "Order_createdByUserId_idx" ON "Order"("createdByUserId");
CREATE INDEX IF NOT EXISTS "Order_updatedByUserId_idx" ON "Order"("updatedByUserId");

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_createdByUserId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_updatedByUserId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Collection" DROP CONSTRAINT IF EXISTS "Collection_createdByUserId_fkey";
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Collection" DROP CONSTRAINT IF EXISTS "Collection_updatedByUserId_fkey";
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_createdByUserId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_updatedByUserId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unify: published designs are Explore-visible for their stored audience
UPDATE "Product"
SET "postedToMarketAt" = COALESCE("postedToMarketAt", "updatedAt", "createdAt")
WHERE "status" = 'published' AND "postedToMarketAt" IS NULL;
