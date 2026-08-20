-- Snapshot: buyers cannot forward this design/collection beyond supplier share
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allowForward" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "allowForward" BOOLEAN NOT NULL DEFAULT true;

-- Buyer group: null = inherit company usual defaults
ALTER TABLE "BroadcastList"
  ALTER COLUMN "defaultRateVisibility" DROP NOT NULL,
  ALTER COLUMN "defaultRateVisibility" DROP DEFAULT,
  ALTER COLUMN "allowForward" DROP NOT NULL,
  ALTER COLUMN "allowForward" DROP DEFAULT;
