-- At most one pending access request may exist per (requester -> target) pair.
-- A partial unique index enforces this atomically, closing the findFirst-then-
-- create race, while still allowing many historical (approved/declined) rows.
-- Authored by hand because Prisma's schema cannot express a filtered unique index.
CREATE UNIQUE INDEX "AccessRequest_pending_unique"
  ON "AccessRequest" ("requesterCompanyId", "targetCompanyId")
  WHERE "status" = 'pending';
