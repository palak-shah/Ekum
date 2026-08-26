-- CreateTable
CREATE TABLE "CatalogShareLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "collectionId" TEXT,
    "productId" TEXT,
    "createdByCompanyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogShareLink_token_key" ON "CatalogShareLink"("token");

-- CreateIndex
CREATE INDEX "CatalogShareLink_expiresAt_idx" ON "CatalogShareLink"("expiresAt");
