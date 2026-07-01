ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

WITH numbered AS (
  SELECT
    id,
    "createdAt",
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM "createdAt")
      ORDER BY "createdAt", id
    ) AS sequence
  FROM "Order"
)
UPDATE "Order" AS orders
SET "orderNumber" = 'ORD-' ||
  EXTRACT(YEAR FROM numbered."createdAt")::int::text ||
  '-' ||
  LPAD(numbered.sequence::text, 4, '0')
FROM numbered
WHERE orders.id = numbered.id;

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
