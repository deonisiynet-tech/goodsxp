# ✅ НАЛАШТУВАННЯ .env ЗАВЕРШЕНО

## Що зроблено

### 1. Створено єдиний `.env` в корені проекту
📁 `shop-mvp/.env` - містить всі змінні для сервера, бази даних та frontend

### 2. Видалено `server/.env`
Цей файл більше не потрібен

### 3. Оновлено сервер
`server/src/server.ts` тепер читає `.env` з кореня

### 4. Оновлено Prisma
`server/src/prisma/config.ts` тепер читає `.env` з кореня

### 5. Оновлено скрипти
`server/package.json` використовує `dotenv -e ../.env`

## 🚀 Як користуватися

### Запуск сервера
```bash
cd server
npm run dev
```

### Prisma команди
```bash
cd server

# Генерація Client
npm run prisma:generate

# Міграція БД
npm run prisma:migrate

# Prisma Studio
npm run prisma:studio
```

### Міграція для slug (якщо ще не виконали)
```bash
# Підключіться до бази через DBeaver або psql
# Виконайте SQL з файлу: server/prisma/add-slug-migration.sql
```

### Запуск frontend
```bash
cd client
npm run dev
```

## 📝 Змінні в корені .env

```env
# Сервер
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=goodsxp.net@gmail.com
ADMIN_PASSWORD=Admin123

# База даних (ЛОКАЛЬНА)
DATABASE_URL=postgresql://postgres:goodsxp52@localhost:5432/shop_db?schema=public

# База даних (RAILWAY) - розкоментуйте для продакшену
# DATABASE_URL=postgresql://postgres:uEyJEpCfOxWnOxCtOkXFsNYhyXYthDaq@postgres-u3cx.railway.internal:5432/railway

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=dho1q87qk
CLOUDINARY_API_KEY=679329866265555
CLOUDINARY_API_SECRET=Y8HzBE5cnLyz_86WXNLQ5tMfblU

# Frontend
CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
```

## ✅ Перевірка

1. Сервер запускається: `cd server && npm run dev`
2. Prisma працює: `npm run prisma:generate`
3. Frontend працює: `cd ../client && npm run dev`

## 📚 Документація

- `ENV_SETUP_GUIDE.md` - повна інструкція
- `FIX_2026_03_22.md` - виправлення помилок
- `QUICK_DEPLOY_REVIEWS.md` - інструкція розгортання
