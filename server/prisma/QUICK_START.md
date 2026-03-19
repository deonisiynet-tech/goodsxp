# ⚡ Быстрая инструкция — 5 минут

## 1️⃣ Бэкап (30 сек)

```bash
# В Railway Console скопируйте DATABASE_URL и выполните:
pg_dump "YOUR_DATABASE_URL" --file=backup.sql
```

---

## 2️⃣ Применение миграции (2 мин)

### Вариант A: Через Railway Console (проще)

1. Откройте Railway → Ваш проект → Database → Console
2. Скопируйте содержимое `railway-fix-migration.sql`
3. Вставьте в Console и нажмите **Run**

### Вариант B: Через psql (надёжнее)

```bash
psql "YOUR_DATABASE_URL" -f server/prisma/railway-fix-migration.sql
```

---

## 3️⃣ Генерация Prisma Client (30 сек)

```bash
cd server
npx prisma generate --schema ./prisma/schema.prisma
```

---

## 4️⃣ Проверка (1 мин)

```bash
# Проверка в Railway Console:
# Вставьте содержимое verify-migration.sql и выполните

# Все статусы должны быть ✅ OK
```

---

## 5️⃣ Проверка на сайте (2 мин)

Откройте `http://localhost:5000` и проверьте:

| Что | Где | Ожидается |
|-----|-----|-----------|
| ⭐ Рейтинг | Карточка товара | ⭐⭐⭐⭐⭐ 4.7 |
| 📝 Отзывы | Страница товара | Блок "Отзывы" |
| 📂 Категория | Хлебные крошки | Главная > Категория |
| 💰 Скидка | Цена товара | ~~1599~~ 1299 ₴ |

---

## 🐛 Если что-то не так

```bash
# Пересоздайте Prisma Client
cd server
rm -rf node_modules/.prisma
npx prisma generate --schema ./prisma/schema.prisma

# Перезапустите сервер
npm run dev
```

---

## 📁 Созданные файлы

```
server/prisma/
├── railway-fix-migration.sql    # Основная миграция
├── verify-migration.sql         # Проверка после применения
├── MIGRATION_GUIDE.md           # Полная инструкция
├── QUICK_START.md               # Эта инструкция
└── migrations/
    └── 20260319000000_add_sku_category_rating/
        └── migration.sql        # Prisma миграция
```
