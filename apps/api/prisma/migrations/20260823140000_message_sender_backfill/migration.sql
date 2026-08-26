-- Best-effort backfill for messages sent before sender attribution shipped.
-- Multi-staff companies may mis-attribute very old messages to the owner;
-- new messages always record the real sender on send.
UPDATE "Message" m
SET
  "senderUserId" = owner_row."userId",
  "senderName" = u.name
FROM (
  SELECT DISTINCT ON (cm."companyId") cm."companyId", cm."userId"
  FROM "CompanyMembership" cm
  WHERE cm.role = 'owner'
  ORDER BY cm."companyId", cm."createdAt" ASC
) owner_row
JOIN "User" u ON u.id = owner_row."userId"
WHERE m."senderUserId" IS NULL
  AND m."senderCompanyId" = owner_row."companyId";
