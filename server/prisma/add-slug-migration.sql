-- Міграція для додавання поля slug до таблиці Product
-- Виконайте цей SQL у Railway Console

-- 1. Додаємо поле slug (тимчасово NULL)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- 2. Заповнюємо slug для існуючих товарів
-- Генерація slug з title + випадковий суфікс для унікальності
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
WHERE slug IS NULL OR slug = '';

-- 3. Створюємо індекс для швидкого пошуку
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");

-- 4. Додаємо обмеження унікальності
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_slug_key";
ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");

-- 5. Робимо поле NOT NULL
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

-- Перевірка результату
SELECT id, title, slug FROM "Product" LIMIT 10;
