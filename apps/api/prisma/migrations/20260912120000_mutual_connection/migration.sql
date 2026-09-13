-- Mutual Connection: unordered company pair + status actor.

ALTER TABLE "Connection" ADD COLUMN IF NOT EXISTS "companyLowId" TEXT;
ALTER TABLE "Connection" ADD COLUMN IF NOT EXISTS "companyHighId" TEXT;
ALTER TABLE "Connection" ADD COLUMN IF NOT EXISTS "statusSetByCompanyId" TEXT;

UPDATE "Connection"
SET
  "companyLowId" = CASE
    WHEN "ownerCompanyId" < "viewerCompanyId" THEN "ownerCompanyId"
    ELSE "viewerCompanyId"
  END,
  "companyHighId" = CASE
    WHEN "ownerCompanyId" < "viewerCompanyId" THEN "viewerCompanyId"
    ELSE "ownerCompanyId"
  END,
  "statusSetByCompanyId" = CASE
    WHEN "status" IN ('paused', 'blocked') THEN "ownerCompanyId"
    ELSE NULL
  END
WHERE "companyLowId" IS NULL OR "companyHighId" IS NULL;

-- Keep one row per pair: prefer blocked, then paused, then earliest active
DELETE FROM "Connection" c
WHERE c.id NOT IN (
  SELECT DISTINCT ON ("companyLowId", "companyHighId") id
  FROM "Connection"
  ORDER BY
    "companyLowId",
    "companyHighId",
    CASE status WHEN 'blocked' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
    "createdAt" ASC
);

ALTER TABLE "Connection" ALTER COLUMN "companyLowId" SET NOT NULL;
ALTER TABLE "Connection" ALTER COLUMN "companyHighId" SET NOT NULL;

ALTER TABLE "Connection" DROP CONSTRAINT IF EXISTS "Connection_ownerCompanyId_fkey";
ALTER TABLE "Connection" DROP CONSTRAINT IF EXISTS "Connection_viewerCompanyId_fkey";
DROP INDEX IF EXISTS "Connection_ownerCompanyId_viewerCompanyId_key";
DROP INDEX IF EXISTS "Connection_viewerCompanyId_status_idx";
DROP INDEX IF EXISTS "Connection_ownerCompanyId_status_idx";

ALTER TABLE "Connection" DROP COLUMN IF EXISTS "ownerCompanyId";
ALTER TABLE "Connection" DROP COLUMN IF EXISTS "viewerCompanyId";

CREATE UNIQUE INDEX "Connection_companyLowId_companyHighId_key" ON "Connection"("companyLowId", "companyHighId");
CREATE INDEX "Connection_companyLowId_status_idx" ON "Connection"("companyLowId", "status");
CREATE INDEX "Connection_companyHighId_status_idx" ON "Connection"("companyHighId", "status");

ALTER TABLE "Connection"
  ADD CONSTRAINT "Connection_companyLowId_fkey"
  FOREIGN KEY ("companyLowId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Connection"
  ADD CONSTRAINT "Connection_companyHighId_fkey"
  FOREIGN KEY ("companyHighId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
