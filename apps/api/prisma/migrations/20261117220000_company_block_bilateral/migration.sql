-- Directed bilateral Block (CompanyBlock). Migrate legacy Connection.status=blocked.

CREATE TABLE "CompanyBlock" (
    "id" TEXT NOT NULL,
    "blockerCompanyId" TEXT NOT NULL,
    "blockedCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyBlock_blockerCompanyId_blockedCompanyId_key" ON "CompanyBlock"("blockerCompanyId", "blockedCompanyId");
CREATE INDEX "CompanyBlock_blockedCompanyId_idx" ON "CompanyBlock"("blockedCompanyId");
CREATE INDEX "CompanyBlock_blockerCompanyId_idx" ON "CompanyBlock"("blockerCompanyId");

ALTER TABLE "CompanyBlock" ADD CONSTRAINT "CompanyBlock_blockerCompanyId_fkey" FOREIGN KEY ("blockerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyBlock" ADD CONSTRAINT "CompanyBlock_blockedCompanyId_fkey" FOREIGN KEY ("blockedCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One directed edge from the recorded actor (null actor → companyLowId).
INSERT INTO "CompanyBlock" ("id", "blockerCompanyId", "blockedCompanyId", "createdAt")
SELECT
  gen_random_uuid()::text,
  COALESCE(c."statusSetByCompanyId", c."companyLowId"),
  CASE
    WHEN COALESCE(c."statusSetByCompanyId", c."companyLowId") = c."companyLowId" THEN c."companyHighId"
    ELSE c."companyLowId"
  END,
  NOW()
FROM "Connection" c
WHERE c."status" = 'blocked'
ON CONFLICT ("blockerCompanyId", "blockedCompanyId") DO NOTHING;

-- Connection stays mutual communicate grant; Block lives on CompanyBlock.
UPDATE "Connection"
SET "status" = 'active', "statusSetByCompanyId" = NULL
WHERE "status" = 'blocked';
