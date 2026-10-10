-- Explore: count of designs added on last activity bump; buyer-facing mill credit on curated packs.
ALTER TABLE "Collection" ADD COLUMN "exploreNewDesignCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Collection" ADD COLUMN "showSourceShops" BOOLEAN NOT NULL DEFAULT false;
