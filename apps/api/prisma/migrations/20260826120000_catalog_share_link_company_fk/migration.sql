-- CreateIndex
CREATE INDEX "CatalogShareLink_createdByCompanyId_idx" ON "CatalogShareLink"("createdByCompanyId");

-- AddForeignKey
ALTER TABLE "CatalogShareLink" ADD CONSTRAINT "CatalogShareLink_createdByCompanyId_fkey" FOREIGN KEY ("createdByCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
