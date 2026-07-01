ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "voltages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Product"
SET "voltages" = ARRAY["voltage"]
WHERE "voltage" IS NOT NULL
  AND "voltage" <> ''
  AND cardinality("voltages") = 0;
