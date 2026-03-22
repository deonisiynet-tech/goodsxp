# Миграция для добавления поля slug в таблицу Product

-- Эта миграция добавляет поле slug для SEO-URL товаров

-- 1. Добавляем временное поле slug
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- 2. Заполняем существующие товары slug на основе title
-- Для каждого товара создаём уникальный slug
UPDATE "Product"
SET "slug" = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            title,
            '[^a-zA-Z0-9а-яА-ЯїЇіІєЄґҐ-]',
            '-',
            'g'
        ),
        '-+',
        '-',
        'g'
    )
) || '-' || SUBSTRING(MD5(id || RANDOM()::TEXT) FROM 1 FOR 6)
WHERE slug IS NULL;

-- 3. Создаём индекс для slug
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");

-- 4. Добавляем ограничение уникальности
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Product_slug_key'
    ) THEN
        ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");
    END IF;
END $$;

-- 5. Делаем slug NOT NULL
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
