-- AlterTable
ALTER TABLE "CatalogShareLink" ADD COLUMN "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
