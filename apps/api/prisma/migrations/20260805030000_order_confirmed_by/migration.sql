-- Track which company confirmed the order (seller confirm vs buyer accept-quote).
ALTER TABLE "Order" ADD COLUMN "confirmedByCompanyId" TEXT;
