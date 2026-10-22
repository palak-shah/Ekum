ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "masterCategoryId" TEXT;

CREATE INDEX IF NOT EXISTS "Product_masterCategoryId_idx" ON "Product"("masterCategoryId");

DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_masterCategoryId_fkey"
    FOREIGN KEY ("masterCategoryId") REFERENCES "MasterCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
