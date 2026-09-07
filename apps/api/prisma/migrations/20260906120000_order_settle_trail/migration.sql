-- Settle + order audit trail
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "settledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "settledByUserId" TEXT;

CREATE TABLE IF NOT EXISTS "OrderTrailEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorCompanyId" TEXT,
  "actorUserId" TEXT,
  "summary" TEXT,
  "detail" TEXT,
  "note" TEXT,
  "noteVoiceMediaId" TEXT,
  "noteVoiceUrl" TEXT,
  "noteVoiceDurationMs" INTEGER,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderTrailEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderTrailEvent_orderId_at_idx" ON "OrderTrailEvent"("orderId", "at");
CREATE INDEX IF NOT EXISTS "OrderTrailEvent_actorCompanyId_idx" ON "OrderTrailEvent"("actorCompanyId");
CREATE INDEX IF NOT EXISTS "Order_settledByUserId_idx" ON "Order"("settledByUserId");

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_settledByUserId_fkey"
    FOREIGN KEY ("settledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "OrderTrailEvent" ADD CONSTRAINT "OrderTrailEvent_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
