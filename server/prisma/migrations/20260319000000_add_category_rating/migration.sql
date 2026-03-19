-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "rating" DECIMAL(3,2) DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_rating_idx" ON "Product"("rating");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" 
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
