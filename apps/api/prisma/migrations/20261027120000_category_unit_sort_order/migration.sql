-- Category unit order from the master sheet (index 0 = Rate per primary).
ALTER TABLE "CategoryUnit" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
