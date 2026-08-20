-- Saved references: bookmark a design or collection for later curate.
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT,
    "collectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedItem_companyId_createdAt_idx" ON "SavedItem"("companyId", "createdAt");

CREATE UNIQUE INDEX "SavedItem_companyId_productId_key" ON "SavedItem"("companyId", "productId");

CREATE UNIQUE INDEX "SavedItem_companyId_collectionId_key" ON "SavedItem"("companyId", "collectionId");

ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
