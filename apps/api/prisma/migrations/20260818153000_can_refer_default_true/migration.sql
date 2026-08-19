-- Connect-with-me invites are available to every company.
ALTER TABLE "Company" ALTER COLUMN "canRefer" SET DEFAULT true;
UPDATE "Company" SET "canRefer" = true WHERE "canRefer" = false;
