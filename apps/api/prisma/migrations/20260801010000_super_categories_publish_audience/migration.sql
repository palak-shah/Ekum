-- AlterTable
ALTER TABLE "Company" ADD COLUMN "superCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'connections';
ALTER TABLE "Collection" ADD COLUMN "rateVisibility" TEXT NOT NULL DEFAULT 'on_request';
