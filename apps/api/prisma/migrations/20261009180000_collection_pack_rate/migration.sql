-- Pack Rate / range on the collection (editor + album identity; members may differ).
ALTER TABLE "Collection" ADD COLUMN "rate" DECIMAL(12,2);
ALTER TABLE "Collection" ADD COLUMN "rateMax" DECIMAL(12,2);
