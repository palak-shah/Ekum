-- Rate per (billing) is independent of dispatch unit.
ALTER TABLE "Product" ADD COLUMN "catalogRateUnit" TEXT;
ALTER TABLE "Collection" ADD COLUMN "catalogRateUnit" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "catalogRateUnit" TEXT;
