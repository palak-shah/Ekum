-- Staff attribution per order milestone (internal timeline).
ALTER TABLE "Order" ADD COLUMN "confirmedByUserId" TEXT,
ADD COLUMN "quotedAt" TIMESTAMP(3),
ADD COLUMN "quotedByUserId" TEXT,
ADD COLUMN "deliveredByUserId" TEXT;

ALTER TABLE "OrderShipment" ADD COLUMN "dispatchedByUserId" TEXT;

CREATE INDEX "Order_confirmedByUserId_idx" ON "Order"("confirmedByUserId");
CREATE INDEX "Order_quotedByUserId_idx" ON "Order"("quotedByUserId");
CREATE INDEX "Order_deliveredByUserId_idx" ON "Order"("deliveredByUserId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_quotedByUserId_fkey" FOREIGN KEY ("quotedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveredByUserId_fkey" FOREIGN KEY ("deliveredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderShipment" ADD CONSTRAINT "OrderShipment_dispatchedByUserId_fkey" FOREIGN KEY ("dispatchedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
