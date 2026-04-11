-- Product Variants System
-- 3 new tables: ProductOption, ProductOptionValue, ProductVariant

-- 1. ProductOption — характеристики товару (Колір, Довжина тощо)
CREATE TABLE IF NOT EXISTS "ProductOption" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ProductOption_pkey" PRIMARY KEY ("id")
);

-- 2. ProductOptionValue — значення характеристик (чорний, білий тощо)
CREATE TABLE IF NOT EXISTS "ProductOptionValue" (
  "id" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ProductOptionValue_pkey" PRIMARY KEY ("id")
);

-- 3. ProductVariant — конкретні варіанти товару
CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "options" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ProductOption_productId_idx" ON "ProductOption"("productId");
CREATE INDEX "ProductOptionValue_optionId_idx" ON "ProductOptionValue"("optionId");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- Foreign keys
ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;

ALTER TABLE "ProductOptionValue" ADD CONSTRAINT "ProductOptionValue_optionId_fkey"
  FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE;

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;

-- 4. OrderItem — variant support (замовлення зберігає який варіант замовлено)
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantOptions" JSONB;

CREATE INDEX IF NOT EXISTS "OrderItem_variantId_idx" ON "OrderItem"("variantId");

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL;
