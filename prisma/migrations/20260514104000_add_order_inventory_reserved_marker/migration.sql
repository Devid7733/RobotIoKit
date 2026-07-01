ALTER TABLE "Order" ADD COLUMN "inventoryReservedAt" TIMESTAMP(3);

UPDATE "Order"
SET "inventoryReservedAt" = "createdAt"
WHERE "checkoutKey" IS NOT NULL;
