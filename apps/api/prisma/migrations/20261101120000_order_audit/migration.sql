-- Separate qty audit log. Live Order stays current; one row = one line edit.
CREATE TABLE "OrderAudit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "manualOrderNo" TEXT,
    "itemName" TEXT NOT NULL,
    "sku" TEXT,
    "unit" TEXT,
    "actorCompanyName" TEXT,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "qtyBefore" DECIMAL(12,2),
    "qtyAfter" DECIMAL(12,2) NOT NULL,
    "qtyDelta" DECIMAL(12,2),
    "statusAt" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorCompanyId" TEXT,
    "actorUserId" TEXT,

    CONSTRAINT "OrderAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderAudit_orderId_at_idx" ON "OrderAudit"("orderId", "at");
CREATE INDEX "OrderAudit_kind_idx" ON "OrderAudit"("kind");
CREATE INDEX "OrderAudit_orderItemId_idx" ON "OrderAudit"("orderItemId");

ALTER TABLE "OrderAudit" ADD CONSTRAINT "OrderAudit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
