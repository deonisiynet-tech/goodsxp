-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "originalPrice" DECIMAL(10,2),
ADD COLUMN "discountPrice" DECIMAL(10,2),
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isPopular" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");

-- CreateIndex
CREATE INDEX "Product_isPopular_idx" ON "Product"("isPopular");
