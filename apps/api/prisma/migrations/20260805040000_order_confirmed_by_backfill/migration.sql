-- Legacy confirmed orders predate confirmedByCompanyId.
-- Quote path (rate message exists) → buyer accepted; otherwise seller confirmed.
UPDATE "Order" AS o
SET "confirmedByCompanyId" = o."buyerCompanyId"
WHERE o."confirmedByCompanyId" IS NULL
  AND o."confirmedAt" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "Message" AS m
    WHERE m."referenceId" = o.id
      AND m.type = 'rate'
  );

UPDATE "Order"
SET "confirmedByCompanyId" = "sellerCompanyId"
WHERE "confirmedByCompanyId" IS NULL
  AND "confirmedAt" IS NOT NULL;
