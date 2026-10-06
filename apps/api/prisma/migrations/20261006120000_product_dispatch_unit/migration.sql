-- Dual order / dispatch units on designs and order line snapshots.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "dispatchUnit" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "dispatchUnit" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "piecesPerPack" INTEGER;
