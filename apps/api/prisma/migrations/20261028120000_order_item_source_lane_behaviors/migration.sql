-- Direct-link persisted defaults + hop→parent line mapping + confirm snapshots.

ALTER TABLE "TradeLane" ADD COLUMN "behaviors" JSONB;

ALTER TABLE "OrderItem" ADD COLUMN "confirmedQuantity" DECIMAL(12,2);
ALTER TABLE "OrderItem" ADD COLUMN "confirmedRate" DECIMAL(12,2);
ALTER TABLE "OrderItem" ADD COLUMN "sourceItemId" TEXT;

CREATE INDEX "OrderItem_sourceItemId_idx" ON "OrderItem"("sourceItemId");

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unambiguous historical hop→parent mapping: productId unique on both tickets.
UPDATE "OrderItem" AS hop
SET "sourceItemId" = parent.id
FROM "Order" AS hop_order
JOIN "Order" AS parent_order ON hop_order."downstreamOrderId" = parent_order.id
JOIN "OrderItem" AS parent ON parent."orderId" = parent_order.id
WHERE hop."orderId" = hop_order.id
  AND hop."sourceItemId" IS NULL
  AND hop."productId" IS NOT NULL
  AND parent."productId" = hop."productId"
  AND (
    SELECT COUNT(*)::int FROM "OrderItem" p2
    WHERE p2."orderId" = parent_order.id AND p2."productId" = hop."productId"
  ) = 1
  AND (
    SELECT COUNT(*)::int FROM "OrderItem" h2
    WHERE h2."orderId" = hop_order.id AND h2."productId" = hop."productId"
  ) = 1;

-- Live confirmed/dispatched lines: snapshot current qty/rate as the commitment we have.
UPDATE "OrderItem"
SET
  "confirmedQuantity" = "quantity",
  "confirmedRate" = "rate"
WHERE "lineStatus" IN ('confirmed', 'dispatched', 'delivered')
  AND "confirmedQuantity" IS NULL;
