-- Align legacy OrderItem.lineStatus with parent order status so confirmed
-- orders are dispatchable. Upgrade line-decision system notices to order_card.

UPDATE "OrderItem" AS oi
SET "lineStatus" = 'confirmed'
FROM "Order" AS o
WHERE oi."orderId" = o.id
  AND o.status = 'confirmed'
  AND oi."lineStatus" = 'open';

UPDATE "OrderItem" AS oi
SET "lineStatus" = 'dispatched'
FROM "Order" AS o
WHERE oi."orderId" = o.id
  AND o.status = 'dispatched'
  AND oi."lineStatus" IN ('open', 'confirmed');

UPDATE "OrderItem" AS oi
SET "lineStatus" = 'delivered'
FROM "Order" AS o
WHERE oi."orderId" = o.id
  AND o.status = 'delivered'
  AND oi."lineStatus" IN ('open', 'confirmed', 'dispatched');

UPDATE "Message"
SET type = 'order_card'
WHERE type = 'system'
  AND "referenceId" IS NOT NULL
  AND (metadata->>'kind') = 'order_lines';
