# Інструкція з оновлення бази даних

## Проблема
Після додавання системи відгуків потрібно додати поле `slug` до таблиці `Product` для SEO-URL.

## Рішення

### Варіант 1: Виконати міграцію на Railway

1. Підключіться до бази даних Railway через psql або інший клієнт:
```bash
psql <DATABASE_URL>
```

2. Виконайте SQL-міграцію:
```bash
psql <DATABASE_URL> < prisma/add-slug-migration.sql
```

Або скопіюйте вміст `prisma/add-slug-migration.sql` і виконайте у Railway Console.

### Варіант 2: Використати Prisma CLI локально

Якщо у вас є локальна копія бази даних:

```bash
cd server
npx prisma migrate dev --name add_product_slug
```

### Варіант 3: Оновити Prisma Client

Після виконання міграції обов'язково оновіть Prisma Client:

```bash
cd server
npx prisma generate
```

## Перевірка

Після виконання міграції перевірте, що поле `slug` додано:

```sql
SELECT id, title, slug FROM "Product" LIMIT 5;
```

## API Ендпоінти

Після оновлення бази даних будуть доступні нові ендпоінти:

- `GET /api/products/:slug` - отримати товар по slug
- `GET /api/products/id/:id` - отримати товар по ID (старий ендпоінт)

## Фронтенд

Товари тепер відкриваються за URL:
- `/catalog/product-slug` замість `/catalog?id=product-id`

## Відкоти

Якщо потрібно відкотити зміни:

```sql
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_slug_key";
DROP INDEX IF EXISTS "Product_slug_idx";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "slug";
```
