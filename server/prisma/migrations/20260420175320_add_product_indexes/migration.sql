-- CreateIndex
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- CreateIndex
CREATE INDEX "Product_isActive_isFeatured_idx" ON "Product"("isActive", "isFeatured");

-- CreateIndex
CREATE INDEX "Product_isActive_isPopular_idx" ON "Product"("isActive", "isPopular");

-- CreateIndex
CREATE INDEX "Product_isActive_categoryId_idx" ON "Product"("isActive", "categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_createdAt_idx" ON "Product"("isActive", "createdAt");
