-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "buyerCompanyId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "createdByCompanyId" TEXT NOT NULL,
    "note" TEXT,
    "transporter" TEXT,
    "lrNumber" TEXT,
    "parcelCount" INTEGER,
    "confirmedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "rate" DECIMAL(12,2),
    "unit" TEXT,
    "image" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "transporter" TEXT,
    "lrNumber" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "escalatedFromReturnId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requestedQuantity" DECIMAL(12,2) NOT NULL,
    "approvedQuantity" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "raisedByCompanyId" TEXT NOT NULL,
    "againstCompanyId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_buyerCompanyId_status_idx" ON "Order"("buyerCompanyId", "status");

-- CreateIndex
CREATE INDEX "Order_sellerCompanyId_status_idx" ON "Order"("sellerCompanyId", "status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Sample_buyerCompanyId_status_idx" ON "Sample"("buyerCompanyId", "status");

-- CreateIndex
CREATE INDEX "Sample_sellerCompanyId_status_idx" ON "Sample"("sellerCompanyId", "status");

-- CreateIndex
CREATE INDEX "Return_orderId_idx" ON "Return"("orderId");

-- CreateIndex
CREATE INDEX "Return_buyerCompanyId_status_idx" ON "Return"("buyerCompanyId", "status");

-- CreateIndex
CREATE INDEX "Return_sellerCompanyId_status_idx" ON "Return"("sellerCompanyId", "status");

-- CreateIndex
CREATE INDEX "ReturnItem_returnId_idx" ON "ReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "Complaint_orderId_idx" ON "Complaint"("orderId");

-- CreateIndex
CREATE INDEX "Complaint_raisedByCompanyId_idx" ON "Complaint"("raisedByCompanyId");

-- CreateIndex
CREATE INDEX "Complaint_againstCompanyId_idx" ON "Complaint"("againstCompanyId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_escalatedFromReturnId_fkey" FOREIGN KEY ("escalatedFromReturnId") REFERENCES "Return"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
