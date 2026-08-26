-- Hold I-handle mill tickets until Send. Existing linked hops stay visible.
ALTER TABLE "Order" ADD COLUMN "upstreamReleasedAt" TIMESTAMP(3);

UPDATE "Order"
SET "upstreamReleasedAt" = "createdAt"
WHERE "downstreamOrderId" IS NOT NULL;
