-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "audienceCompanyIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
