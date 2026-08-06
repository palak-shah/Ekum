-- AlterTable
ALTER TABLE "Product" ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'connections';
ALTER TABLE "Product" ADD COLUMN "rateVisibility" TEXT NOT NULL DEFAULT 'on_request';
ALTER TABLE "Product" ADD COLUMN "audienceCompanyIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN "postedToMarketAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Product_postedToMarketAt_idx" ON "Product"("postedToMarketAt");
