-- Persist which buyer groups were chosen on publish so Visibility can restore chips.
ALTER TABLE "Product" ADD COLUMN "audienceGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Collection" ADD COLUMN "audienceGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
