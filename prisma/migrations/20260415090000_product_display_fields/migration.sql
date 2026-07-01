ALTER TABLE "Product" RENAME COLUMN "image" TO "imageUrl";

ALTER TABLE "Product"
ADD COLUMN "badge" TEXT,
ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.7,
ADD COLUMN "overview" TEXT,
ADD COLUMN "features" JSONB,
ADD COLUMN "compatibility" JSONB,
ADD COLUMN "specifications" JSONB;

UPDATE "Product"
SET
  "overview" = COALESCE("overview", "description"),
  "features" = COALESCE("features", '["Project ready","Student friendly","Reliable stock","Tested module"]'::jsonb),
  "compatibility" = COALESCE("compatibility", '["ESP32 boards","Starter robot builds","Lab prototypes"]'::jsonb),
  "specifications" = COALESCE(
    "specifications",
    jsonb_build_array(
      jsonb_build_object('label', 'SKU', 'value', COALESCE("sku", 'N/A')),
      jsonb_build_object('label', 'Stock', 'value', "stock"::text),
      jsonb_build_object('label', 'Use Case', 'value', 'Robotics and embedded prototypes')
    )
  );
