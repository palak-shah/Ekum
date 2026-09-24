-- Follow-ask: pending is not a follower. Existing rows stay allowed + look.
ALTER TABLE "Follow" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'allowed';
ALTER TABLE "Follow" ADD COLUMN "accessKind" TEXT;

UPDATE "Follow" SET "accessKind" = 'look' WHERE "accessKind" IS NULL;

CREATE INDEX "Follow_followedCompanyId_status_idx" ON "Follow"("followedCompanyId", "status");
