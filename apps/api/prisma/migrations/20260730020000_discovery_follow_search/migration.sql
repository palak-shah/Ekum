-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerCompanyId" TEXT NOT NULL,
    "followedCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Follow_followedCompanyId_idx" ON "Follow"("followedCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerCompanyId_followedCompanyId_key" ON "Follow"("followerCompanyId", "followedCompanyId");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerCompanyId_fkey" FOREIGN KEY ("followerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followedCompanyId_fkey" FOREIGN KEY ("followedCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Search: trigram indexes so case-insensitive substring search (ILIKE '%q%') on
-- names stays fast as the catalogue grows. Managed here rather than in the Prisma
-- schema to avoid a preview-feature dependency.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Company_name_trgm_idx" ON "Company" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Collection_name_trgm_idx" ON "Collection" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);
