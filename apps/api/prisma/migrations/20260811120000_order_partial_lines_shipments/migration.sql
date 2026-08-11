-- Partial orders: line status + original qty; split fulfillment shipments.

ALTER TABLE "OrderItem" ADD COLUMN "requestedQuantity" DECIMAL(12,2);
ALTER TABLE "OrderItem" ADD COLUMN "lineStatus" TEXT NOT NULL DEFAULT 'open';

UPDATE "OrderItem" SET "requestedQuantity" = "quantity" WHERE "requestedQuantity" IS NULL;

ALTER TABLE "OrderItem" ALTER COLUMN "requestedQuantity" SET NOT NULL;

CREATE TABLE "OrderShipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "transporter" TEXT,
    "lrNumber" TEXT,
    "parcelCount" INTEGER,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderShipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "OrderShipmentItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderShipment_orderId_idx" ON "OrderShipment"("orderId");
CREATE INDEX "OrderShipmentItem_shipmentId_idx" ON "OrderShipmentItem"("shipmentId");
CREATE INDEX "OrderShipmentItem_orderItemId_idx" ON "OrderShipmentItem"("orderItemId");

ALTER TABLE "OrderShipment" ADD CONSTRAINT "OrderShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderShipmentItem" ADD CONSTRAINT "OrderShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "OrderShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderShipmentItem" ADD CONSTRAINT "OrderShipmentItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
