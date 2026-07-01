ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PREPARING', 'SHIPPED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Order"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "OrderStatus" USING (
    CASE "status"::text
      WHEN 'DELIVERED' THEN 'COMPLETED'
      WHEN 'PAID' THEN 'PREPARING'
      ELSE "status"::text
    END
  )::"OrderStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "OrderStatus_old";

ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'EXPIRED');
ALTER TABLE "Payment"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PaymentStatus" USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'UNPAID'
      ELSE "status"::text
    END
  )::"PaymentStatus",
  ALTER COLUMN "status" SET DEFAULT 'UNPAID';
DROP TYPE "PaymentStatus_old";

ALTER TABLE "Order" ADD COLUMN "checkoutKey" TEXT;
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");
