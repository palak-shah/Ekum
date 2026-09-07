-- Collection view Ask → Allow (pack grant) / Deny (silent to requester).
CREATE TABLE "CollectionViewGrant" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionViewGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CollectionViewRequest" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "requesterCompanyId" TEXT NOT NULL,
    "targetCompanyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "threadId" TEXT,
    "messageId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionViewRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollectionViewGrant_collectionId_companyId_key" ON "CollectionViewGrant"("collectionId", "companyId");
CREATE INDEX "CollectionViewGrant_companyId_grantedAt_idx" ON "CollectionViewGrant"("companyId", "grantedAt");

CREATE INDEX "CollectionViewRequest_requesterCompanyId_status_idx" ON "CollectionViewRequest"("requesterCompanyId", "status");
CREATE INDEX "CollectionViewRequest_targetCompanyId_status_idx" ON "CollectionViewRequest"("targetCompanyId", "status");
CREATE INDEX "CollectionViewRequest_collectionId_status_idx" ON "CollectionViewRequest"("collectionId", "status");
CREATE UNIQUE INDEX "CollectionViewRequest_pending_unique"
  ON "CollectionViewRequest" ("collectionId", "requesterCompanyId")
  WHERE "status" = 'pending';

ALTER TABLE "CollectionViewGrant" ADD CONSTRAINT "CollectionViewGrant_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionViewGrant" ADD CONSTRAINT "CollectionViewGrant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollectionViewRequest" ADD CONSTRAINT "CollectionViewRequest_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionViewRequest" ADD CONSTRAINT "CollectionViewRequest_requesterCompanyId_fkey" FOREIGN KEY ("requesterCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionViewRequest" ADD CONSTRAINT "CollectionViewRequest_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
