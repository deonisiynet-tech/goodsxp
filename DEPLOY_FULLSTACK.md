# 🚀 Деплой GoodsXP на Railway (Full-Stack)

## 📋 Архітектура

```
┌─────────────────────────────────────┐
│      Express Server (PORT)          │
│                                     │
│  /api/*     →  Express API Routes   │
│  /health    →  Health Check         │
│  /*         →  Next.js App          │
└─────────────────────────────────────┘
```

Один сервер обслуговує і API, і Frontend!

---

## 🔧 Налаштування

### 1. Змінні оточення в Railway Dashboard

Відкрийте **Railway Dashboard** → ваш проект → **Variables**

Додайте:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:...@postgres.railway.internal:5432/railway` |
| `JWT_SECRET` | `goodsxp-super-secret-jwt-key-2026` |
| `ADMIN_EMAIL` | `goodsxp.net@gmail.com` |
| `ADMIN_PASSWORD` | `Admin123` |
| `NEXT_DIR` | `./client` |

---

### 2. Конфігурація Railway

**Build Command:** (автоматично з Dockerfile)
```bash
npm install (client)
npm install (server)
npx prisma generate
npm run build (client)
npm run build (server)
```

**Start Command:** (автоматично з Dockerfile)
```bash
npx prisma migrate deploy && node dist/server.js
```

**Root Directory:** залиште порожнім (або вкажіть `.`)

---

## 🚀 Деплой

### Крок 1: Закоммітьте зміни

```bash
cd c:\Users\User\Desktop\shop-mvp
git add .
git commit -m "Deploy: full-stack integration (Express + Next.js)"
git push origin main
```

### Крок 2: Railway автоматично задеплоїть

1. Відкрийте **Railway Dashboard**
2. Перейдіть у **Deployments**
3. Зачекайте 5-10 хвилин

### Крок 3: Перевірте логи

Повинні побачити:

```
🔧 SERVER FILE LOADED
📦 NODE_ENV: production
📦 DATABASE_URL: *** SET ***
✅ Next.js prepared successfully
✅ SERVER STARTED
🚀 Server running on port 8080
📡 API available at http://localhost:8080/api
🏠 Frontend available at http://localhost:8080
```

### Крок 4: Відкрийте сайт

1. Скопіюйте **Public Domain** з **Settings**
2. Відкрийте у браузері: `https://your-app.railway.app`

---

## ✅ Перевірка

### API працює:
```
https://your-app.railway.app/health
https://your-app.railway.app/api/products
```

### Frontend працює:
```
https://your-app.railway.app
https://your-app.railway.app/admin
```

---

## 🐛 Відладка

### Проблема: "DATABASE_URL is not set"

**Рішення:** Додайте змінну в Railway Dashboard → Variables

### Проблема: "Cannot find module 'next'"

**Рішення:** Переконайтеся, що `next` є в `server/package.json`

### Проблема: "Next.js prepared failed"

**Рішення:** Перевірте, що `client/.next` існує після збірки

### Проблема: Healthcheck fails

**Рішення:** Переконайтеся, що `/health` endpoint доступний

---

## 📁 Структура файлів

```
shop-mvp/
├── Dockerfile              # Єдиний для client + server
├── server/
│   ├── src/
│   │   ├── server.ts       # Головний файл (Express + Next.js)
│   │   ├── routes/         # API роути
│   │   ├── middleware/     # Middleware
│   │   ├── services/       # Бізнес-логіка
│   │   └── prisma/         # Prisma клієнт
│   └── package.json        # Залежності + next, react, react-dom
├── client/
│   ├── src/
│   │   ├── app/            # Next.js сторінки
│   │   ├── components/     # React компоненти
│   │   └── lib/            # API клієнт
│   ├── .env.local          # NEXT_PUBLIC_API_URL=/api
│   └── package.json
└── ...
```

---

## 🔑 Ключові зміни

1. **server.ts** імпортує Next.js і обробляє всі запити `/*`
2. **API роути** обробляються ПЕРШИМИ (`/api/*`)
3. **Next.js** обробляє всі інші запити
4. **Dockerfile** збирає і client, і server
5. **NEXT_PUBLIC_API_URL=/api** для проксірування запитів

---

**Дата**: Березень 2026  
**Статус**: Ready for Production
