# Інструкція з оновлення бази даних для Railway

## ⚠️ ВАЖЛИВО: Виконайте це ПЕРЕД розгортанням

Після додавання системи відгуків та SEO-URL потрібно додати поле `slug` до таблиці `Product`.

## Крок 1: Виконайте міграцію на Railway

### Спосіб 1: Через Railway Console (рекомендовано)

1. Відкрийте ваш проект на Railway
2. Перейдіть до бази даних PostgreSQL
3. Відкрийте **Console** (SQL редактор)
4. Скопіюйте та виконайте весь SQL з файлу `prisma/add-slug-migration.sql`

### Спосіб 2: Через psql

```bash
# Отримайте DATABASE_URL з Railway
# Виконайте міграцію
psql <YOUR_RAILWAY_DATABASE_URL> -f prisma/add-slug-migration.sql
```

## Крок 2: Перевірте міграцію

У Railway Console виконайте:

```sql
SELECT id, title, slug FROM "Product" LIMIT 5;
```

Ви повинні побачити поле `slug` для кожного товару.

## Крок 3: Розгорніть оновлений код

Після виконання міграції:

1. Запуште зміни в Git
2. Railway автоматично розгорне оновлення
3. Перевірте логи - помилок бути не повинно

## Крок 4: Перевірте роботу

Відкрийте ваш сайт і перевірте:

1. ✅ Каталог товарів відкривається
2. ✅ Клік на товар відкриває `/catalog/product-slug`
3. ✅ Відгуки відображаються
4. ✅ Форма додавання відгуку працює
5. ✅ Знижки показуються правильно

## SQL міграція (prisma/add-slug-migration.sql)

```sql
-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Populate existing products with slug
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

-- Add index
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");

-- Add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Product_slug_key'
    ) THEN
        ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");
    END IF;
END $$;

-- Make slug NOT NULL
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
```

## Вирішення проблем

### Помилка "slug does not exist"

Це означає, що міграція не виконана. Виконайте Крок 1.

### Помилка "duplicate key value violates unique constraint"

Деякі товари мають однакові slug. Виконайте:

```sql
-- Додати випадковий суфікс до дублікатів
UPDATE "Product" p1
SET slug = p1.slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)
WHERE EXISTS (
    SELECT 1 FROM "Product" p2
    WHERE p2.slug = p1.slug AND p2.id != p1.id
);
```

### Товари без slug

Якщо є товари без slug:

```sql
UPDATE "Product"
SET slug = LOWER(
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
```

## Швидка перевірка

```sql
-- Перевірка кількості товарів з slug
SELECT COUNT(*) as total, COUNT(slug) as with_slug FROM "Product";

-- Перевірка на дублікати slug
SELECT slug, COUNT(*) FROM "Product" GROUP BY slug HAVING COUNT(*) > 1;

-- Перевірка на NULL slug
SELECT COUNT(*) FROM "Product" WHERE slug IS NULL;
```

## Після успішного розгортання

Все має працювати:
- Товари відкриваються по slug
- Відгуки працюють
- Рейтинг розраховується
- Знижки відображаються
