-- Batch 3: repost buyer-facing calculation columns (Same / Margin / Edit).
-- Ask remains Collection.rateVisibility = on_request — do NOT add an ask mode.
-- Nullable only; no blind backfill of rateVisibility or historical rows.

ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostPricingMode" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostMarginValue" DECIMAL(12,2);
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostEditedRate" DECIMAL(12,2);
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "repostEditOwnBase" DECIMAL(12,2);

ALTER TABLE "CollectionProduct" ADD COLUMN IF NOT EXISTS "pricingMode" TEXT;
ALTER TABLE "CollectionProduct" ADD COLUMN IF NOT EXISTS "marginValue" DECIMAL(12,2);
ALTER TABLE "CollectionProduct" ADD COLUMN IF NOT EXISTS "editedRate" DECIMAL(12,2);
ALTER TABLE "CollectionProduct" ADD COLUMN IF NOT EXISTS "editOwnBase" DECIMAL(12,2);
