-- CreateTable: ProductSlugRedirect
-- Зберігає старі slug товарів для 301 редіректів при перейменуванні

CREATE TABLE "ProductSlugRedirect" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "newSlug" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSlugRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSlugRedirect_oldSlug_key" ON "ProductSlugRedirect"("oldSlug");

-- CreateIndex
CREATE INDEX "ProductSlugRedirect_oldSlug_idx" ON "ProductSlugRedirect"("oldSlug");

-- CreateIndex
CREATE INDEX "ProductSlugRedirect_productId_idx" ON "ProductSlugRedirect"("productId");

-- AddForeignKey
ALTER TABLE "ProductSlugRedirect" ADD CONSTRAINT "ProductSlugRedirect_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
