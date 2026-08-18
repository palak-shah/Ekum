-- Buyer groups: defaults for publish sheet
ALTER TABLE "BroadcastList" ADD COLUMN "defaultRateVisibility" TEXT NOT NULL DEFAULT 'on_request';
ALTER TABLE "BroadcastList" ADD COLUMN "allowForward" BOOLEAN NOT NULL DEFAULT true;

-- Collection live window (null endsAt = evergreen; null startsAt = live on publish)
ALTER TABLE "Collection" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "Collection" ADD COLUMN "endsAt" TIMESTAMP(3);

CREATE INDEX "Collection_status_endsAt_idx" ON "Collection"("status", "endsAt");
CREATE INDEX "Collection_status_startsAt_idx" ON "Collection"("status", "startsAt");
