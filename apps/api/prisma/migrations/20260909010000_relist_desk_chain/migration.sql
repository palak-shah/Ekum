-- Desk-chain Ask: pack source on request; grant provenance for cascade revoke
ALTER TABLE "ProductRelistGrant" ADD COLUMN "grantedByCompanyId" TEXT;
CREATE INDEX "ProductRelistGrant_grantedByCompanyId_productId_idx" ON "ProductRelistGrant"("grantedByCompanyId", "productId");

ALTER TABLE "RelistRequest" ADD COLUMN "sourceCollectionId" TEXT;
