-- Pack look-through grants expire 48h after Allow (share-link claim no longer grants).

ALTER TABLE "CollectionViewGrant" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Existing rows: clock started at grantedAt (already-elapsed grants become inert immediately).
UPDATE "CollectionViewGrant"
SET "expiresAt" = "grantedAt" + INTERVAL '48 hours'
WHERE "expiresAt" IS NULL;

ALTER TABLE "CollectionViewGrant" ALTER COLUMN "expiresAt" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "CollectionViewGrant_expiresAt_idx"
  ON "CollectionViewGrant"("expiresAt");
