-- Relist Ask (Slice B): product pack permission grants + requests
CREATE TABLE "ProductRelistGrant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductRelistGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RelistRequest" (
    "id" TEXT NOT NULL,
    "productIds" TEXT[],
    "requesterCompanyId" TEXT NOT NULL,
    "targetCompanyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "threadId" TEXT,
    "messageId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelistRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductRelistGrant_productId_companyId_key" ON "ProductRelistGrant"("productId", "companyId");
CREATE INDEX "ProductRelistGrant_companyId_grantedAt_idx" ON "ProductRelistGrant"("companyId", "grantedAt");
CREATE INDEX "RelistRequest_requesterCompanyId_status_idx" ON "RelistRequest"("requesterCompanyId", "status");
CREATE INDEX "RelistRequest_targetCompanyId_status_idx" ON "RelistRequest"("targetCompanyId", "status");

ALTER TABLE "ProductRelistGrant" ADD CONSTRAINT "ProductRelistGrant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductRelistGrant" ADD CONSTRAINT "ProductRelistGrant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelistRequest" ADD CONSTRAINT "RelistRequest_requesterCompanyId_fkey" FOREIGN KEY ("requesterCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelistRequest" ADD CONSTRAINT "RelistRequest_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
