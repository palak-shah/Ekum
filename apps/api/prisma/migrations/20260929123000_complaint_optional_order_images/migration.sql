-- AlterTable
ALTER TABLE "Complaint" ALTER COLUMN "orderId" DROP NOT NULL;
ALTER TABLE "Complaint" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT IF EXISTS "Complaint_orderId_fkey";

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
