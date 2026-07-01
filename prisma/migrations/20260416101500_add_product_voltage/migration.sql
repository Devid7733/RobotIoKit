ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "voltage" TEXT;

UPDATE "Product"
SET "voltage" = voltage_spec.value
FROM (
  SELECT
    p."id",
    spec->>'value' AS value
  FROM "Product" p
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p."specifications", '[]'::jsonb)) AS spec
  WHERE LOWER(spec->>'label') = 'voltage'
) AS voltage_spec
WHERE "Product"."id" = voltage_spec."id"
  AND ("Product"."voltage" IS NULL OR "Product"."voltage" = '');
