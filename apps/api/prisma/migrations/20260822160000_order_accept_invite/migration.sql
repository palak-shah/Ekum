-- CreateTable
CREATE TABLE "OrderAcceptInvite" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAcceptInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderAcceptInvite_token_key" ON "OrderAcceptInvite"("token");

-- CreateIndex
CREATE INDEX "OrderAcceptInvite_phone_usedAt_idx" ON "OrderAcceptInvite"("phone", "usedAt");

-- AddForeignKey
ALTER TABLE "OrderAcceptInvite" ADD CONSTRAINT "OrderAcceptInvite_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
