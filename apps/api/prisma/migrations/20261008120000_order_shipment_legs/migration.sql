-- CreateTable
CREATE TABLE "OrderShipmentLeg" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "lrNumber" TEXT,
    "billNumber" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderShipmentLeg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderShipmentLeg_shipmentId_idx" ON "OrderShipmentLeg"("shipmentId");

-- AddForeignKey
ALTER TABLE "OrderShipmentLeg" ADD CONSTRAINT "OrderShipmentLeg_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "OrderShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one leg per existing shipment that has an LR (bill null).
INSERT INTO "OrderShipmentLeg" ("id", "shipmentId", "lrNumber", "billNumber", "sortOrder")
SELECT
  md5(s."id" || ':leg0'),
  s."id",
  s."lrNumber",
  NULL,
  0
FROM "OrderShipment" s
WHERE s."lrNumber" IS NOT NULL AND TRIM(s."lrNumber") <> '';
