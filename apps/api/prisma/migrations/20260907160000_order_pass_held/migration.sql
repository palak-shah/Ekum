-- Trader I-handle: freeze pass-through on a mill hop (⋯ Hold).
ALTER TABLE "Order" ADD COLUMN "passHeldAt" TIMESTAMP(3);
