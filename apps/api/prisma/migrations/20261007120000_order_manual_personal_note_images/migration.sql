-- Shared manual order ref on Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "manualOrderNo" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "manualOrderNote" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "manualOrderImages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Trail note images
ALTER TABLE "OrderTrailEvent" ADD COLUMN IF NOT EXISTS "noteImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Private per-company personal note
CREATE TABLE IF NOT EXISTS "OrderCompanyNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "note" TEXT,
    "noteVoiceMediaId" TEXT,
    "noteVoiceUrl" TEXT,
    "noteVoiceDurationMs" INTEGER,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCompanyNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrderCompanyNote_orderId_companyId_key" ON "OrderCompanyNote"("orderId", "companyId");
CREATE INDEX IF NOT EXISTS "OrderCompanyNote_companyId_idx" ON "OrderCompanyNote"("companyId");

DO $$ BEGIN
  ALTER TABLE "OrderCompanyNote" ADD CONSTRAINT "OrderCompanyNote_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrderCompanyNote" ADD CONSTRAINT "OrderCompanyNote_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
