# 📦 Миграция для Railway — Итоговый пакет

## 📄 Созданные файлы

| Файл | Назначение |
|------|------------|
| `railway-fix-migration.sql` | **Основная миграция** — примените к Railway |
| `verify-migration.sql` | Проверка после применения |
| `MIGRATION_GUIDE.md` | Подробная инструкция |
| `QUICK_START.md` | Быстрый старт (5 минут) |
| `migrations/20260319000000_add_sku_category_rating/migration.sql` | Prisma миграция |

---

## 🚀 Быстрое применение

### 1. Бэкап
```bash
pg_dump "YOUR_DATABASE_URL" --file=backup.sql
```

### 2. Миграция
```bash
psql "YOUR_DATABASE_URL" -f server/prisma/railway-fix-migration.sql
```

### 3. Prisma Client
```bash
cd server
npx prisma generate --schema ./prisma/schema.prisma
```

### 4. Проверка
```bash
# В Railway Console выполните verify-migration.sql
# Все статусы должны быть ✅ OK
```

---

## 📊 Что добавлено

### Таблицы

| Таблица | Поля | Назначение |
|---------|------|------------|
| `Review` | id, productId, name, rating, comment, createdAt | Отзывы о товарах |
| `Category` | id, name, slug, description, parentId | Категории товаров |
| `SystemLog` | id, timestamp, level, message, userId, source | Системные логи |

### Поля в Product

| Поле | Тип | Nullable | Описание |
|------|-----|----------|----------|
| `categoryId` | TEXT | ✅ | Связь с категорией |
| `rating` | DECIMAL(3,2) | ✅ | Средний рейтинг (0.00-5.00) |
| `originalPrice` | DECIMAL(10,2) | ✅ | Оригинальная цена |
| `discountPrice` | DECIMAL(10,2) | ✅ | Цена со скидкой |
| `isFeatured` | BOOLEAN | ❌ (default false) | Рекомендуемый товар |
| `isPopular` | BOOLEAN | ❌ (default false) | Популярный товар |

### Foreign Keys

- `Product.categoryId` → `Category.id` (ON DELETE SET NULL)
- `Review.productId` → `Product.id` (ON DELETE CASCADE)
- `SystemLog.userId` → `User.id` (ON DELETE SET NULL)

### Индексы

- `Product_sku_idx`, `Product_categoryId_idx`, `Product_rating_idx`
- `Product_isFeatured_idx`, `Product_isPopular_idx`
- `Review_productId_idx`, `Review_createdAt_idx`, `Review_rating_idx`

---

## ✅ Проверка на сайте

| Функция | URL | Ожидается |
|---------|-----|-----------|
| Рейтинг товаров | `/products/:id` | ⭐⭐⭐⭐⭐ 4.7 |
| Отзывы | `/products/:id` (блок Reviews) | Список + форма |
| Категория | Хлебные крошки | Главная > Категория |
| Скидка | Цена товара | ~~1599₴~~ 1299₴ |

---

## 🔧 API Endpoints для проверки

```bash
# Получить товары с новыми полями
GET /api/products

# Получить отзывы товара
GET /api/products/:id/reviews

# Создать отзыв
POST /api/products/:id/reviews
Body: {"name": "Имя", "rating": 5, "comment": "Текст"}

# Получить категории
GET /api/categories

# Получить товары категории
GET /api/products?categoryId=xxx
```

---

## 🐛 Решение проблем

| Ошибка | Решение |
|--------|---------|
| `P2022 ColumnNotFound` | Примените `railway-fix-migration.sql` |
| `table "Review" does not exist` | Примените `railway-fix-migration.sql` |
| `syntax error at or near "("` | Обновите Prisma до v7 |
| Prisma Client не видит поля | `npx prisma generate` + перезапуск |

---

## 📞 Контакты

При проблемах:
1. Проверьте логи Railway
2. Выполните `verify-migration.sql`
3. Восстановите бэкап если нужно
