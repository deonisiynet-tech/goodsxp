# 🚀 Швидка інструкція з розгортання

## ⚠️ Крок 1: Міграція бази даних (ОБОВ'ЯЗКОВО!)

1. Відкрийте **Railway Console** для вашої PostgreSQL бази
2. Скопіюйте цей SQL і виконайте:

```sql
-- Додати поле slug
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Заповнити slug для існуючих товарів
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

-- Індекс
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");

-- Унікальність
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_slug_key";
ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");

-- NOT NULL
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
```

3. Перевірте: `SELECT id, title, slug FROM "Product" LIMIT 5;`

## Крок 2: Розгортання коду

```bash
git add .
git commit -m "feat: reviews system and slug URLs"
git push
```

Railway автоматично збере і розгорне.

## Крок 3: Перевірка

1. Відкрийте ваш сайт
2. Перейдіть в `/catalog`
3. Клікніть на будь-який товар
4. Має відкритись `/catalog/product-slug`
5. Прокрутіть до відгуків - спробуйте додати відгук

## ✅ Все працює!

Якщо бачите помилку "slug does not exist" - виконайте Крок 1 ще раз.

## 📚 Повна документація

- `PRODUCT_REVIEWS_SYSTEM_FIX.md` - повний опис змін
- `server/prisma/RAILWAY_MIGRATION_INSTRUCTION.md` - детальна інструкція міграції
