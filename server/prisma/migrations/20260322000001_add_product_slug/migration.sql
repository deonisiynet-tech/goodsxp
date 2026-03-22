-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "slug" TEXT;

-- Populate existing products with slug
UPDATE "Product"
SET "slug" = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            title,
            '[^a-zA-Z0-9\u0400-\u04FF-]',
            '-',
            'g'
        ),
        '-+',
        '-',
        'g'
    )
) || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);

-- Add index
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- Add unique constraint
ALTER TABLE "Product"
ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");

-- Make slug NOT NULL after populating
ALTER TABLE "Product"
ALTER COLUMN "slug" SET NOT NULL;
