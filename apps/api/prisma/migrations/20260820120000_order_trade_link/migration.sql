-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "tradeMode" TEXT NOT NULL DEFAULT 'bilateral';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "facilitatorCompanyId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "downstreamOrderId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_facilitatorCompanyId_idx" ON "Order"("facilitatorCompanyId");
CREATE INDEX IF NOT EXISTS "Order_downstreamOrderId_idx" ON "Order"("downstreamOrderId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_facilitatorCompanyId_fkey" FOREIGN KEY ("facilitatorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_downstreamOrderId_fkey" FOREIGN KEY ("downstreamOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
