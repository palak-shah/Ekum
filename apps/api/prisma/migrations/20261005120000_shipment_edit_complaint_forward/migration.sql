-- AlterTable
ALTER TABLE "OrderShipment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN "forwardedFromComplaintId" TEXT;

-- CreateIndex
CREATE INDEX "Complaint_forwardedFromComplaintId_idx" ON "Complaint"("forwardedFromComplaintId");

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_forwardedFromComplaintId_fkey" FOREIGN KEY ("forwardedFromComplaintId") REFERENCES "Complaint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
