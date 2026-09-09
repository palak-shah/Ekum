-- TradeLane: trader × mill × buyer path (ticket × reveal)
CREATE TABLE "TradeLane" (
    "id" TEXT NOT NULL,
    "traderCompanyId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "ticket" TEXT NOT NULL DEFAULT 'me',
    "reveal" BOOLEAN NOT NULL DEFAULT false,
    "groupThreadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeLane_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TradeLane_traderCompanyId_sellerCompanyId_buyerCompanyId_key" ON "TradeLane"("traderCompanyId", "sellerCompanyId", "buyerCompanyId");
CREATE INDEX "TradeLane_traderCompanyId_buyerCompanyId_idx" ON "TradeLane"("traderCompanyId", "buyerCompanyId");
CREATE INDEX "TradeLane_groupThreadId_idx" ON "TradeLane"("groupThreadId");

ALTER TABLE "TradeLane" ADD CONSTRAINT "TradeLane_traderCompanyId_fkey" FOREIGN KEY ("traderCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TradeLane" ADD CONSTRAINT "TradeLane_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TradeLane" ADD CONSTRAINT "TradeLane_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
