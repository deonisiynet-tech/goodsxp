-- ✅ CHECK constraint: забороняє stock < 0
-- Запобігає race condition коли stock стає від'ємним при одночасних замовленнях
ALTER TABLE "Product" ADD CONSTRAINT "stock_non_negative" CHECK (stock >= 0);

-- ✅ Індекси для оптимізації SELECT ... FOR UPDATE блокування
CREATE INDEX IF NOT EXISTS "Product_id_isActive_idx" ON "Product"("id", "isActive");
