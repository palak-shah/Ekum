-- AlterTable
ALTER TABLE "OrderShipmentLeg" ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
