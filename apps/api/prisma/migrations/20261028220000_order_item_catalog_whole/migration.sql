-- Whole-catalog Place stamps a group on each member OrderItem.

ALTER TABLE "OrderItem" ADD COLUMN "catalogCollectionId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "catalogName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "catalogWhole" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "OrderItem_catalogCollectionId_idx" ON "OrderItem"("catalogCollectionId");
