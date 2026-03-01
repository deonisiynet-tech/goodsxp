# ✅ Виправлення для Railway Healthcheck

## 📋 Що було виправлено

### 1. **Dockerfile**
- ✅ Прибрано `ENV PORT=5000` (Railway сам інжектить PORT)
- ✅ Прибрано HEALTHCHECK з Dockerfile (Railway використовує свій)
- ✅ Спрощено CMD для запуску сервера

### 2. **.railway.json**
- ✅ Додано `dockerfilePath: "Dockerfile"`
- ✅ Збільшено `healthcheckTimeout` до 600 секунд
- ✅ Прибрано секцію `healthcheck` (Railway ігнорує її)

### 3. ****
- ✅ Синхронізовано з .railway.json
- ✅ Додана секція `[healthcheck]`

### 4. **server/src/server.ts**
- ✅ Покращено healthcheck endpoint (додано uptime і port)
- ✅ Додана обробка помилок сервера (`.on('error')`)
- ✅ Додана обробка `uncaughtException` і `unhandledRejection`
- ✅ Додано перевірку `DATABASE_URL`
- ✅ Покращено graceful shutdown

### 5. **server/src/prisma/client.ts**
- ✅ Додано лениву ініціалізацію Prisma Client
- ✅ Додано логірування для відладки
- ✅ Додано підтримку глобального кешу для hot-reload

### 6. **server/.env.railway**
- ✅ Прибрано `PORT=5000` (Railway сам інжектить)
- ✅ Оновлено JWT_SECRET на більш безпечний
- ✅ Додано коментарі для змінних

---

## 🚀 Інструкція з деплою

### Крок 1: Закоммітьте зміни

```bash
cd c:\Users\User\Desktop\shop-mvp
git add .
git commit -m "Fix: Railway healthcheck configuration and error handling"
git push origin main
```

### Крок 2: Перевірте змінні оточення в Railway Dashboard

**⚠️ КРИТИЧНО ВАЖЛИВО!**

Railway **НЕ** використовує `.env` файли з репозиторію!
Змінні повинні бути в **Railway Dashboard → Variables**:

1. Відкрийте ваш проект на [railway.app](https://railway.app)
2. Перейдіть у **Variables**
3. Переконайтеся, що встановлені:

| Змінна | Значення | Обов'язково |
|--------|----------|-------------|
| `NODE_ENV` | `production` | ✅ |
| `DATABASE_URL` | (автоматично з PostgreSQL) | ✅ |
| `JWT_SECRET` | `goodsxp-super-secret-jwt-key-2026` | ✅ |
| `ADMIN_EMAIL` | `goodsxp.net@gmail.com` | ✅ |
| `ADMIN_PASSWORD` | ваш надійний пароль | ✅ |
| `CLIENT_URL` | `${{RAILWAY_PUBLIC_DOMAIN}}` | ✅ |

**Якщо `DATABASE_URL` немає:**
1. Додайте PostgreSQL: **New** → **Database** → **PostgreSQL**
2. Railway автоматично додасть `DATABASE_URL` у змінні

### Крок 3: Перезапустіть деплой

1. **Railway Dashboard → Deployments**
2. Натисніть **Restart Deployment**
3. Зачекайте 3-5 хвилин

### Крок 4: Перевірте логи

Відкрийте **Deploy Logs** і переконайтеся, що бачите:

```
🔧 Loading environment variables...
📦 NODE_ENV: production
📦 PORT: <число>
📦 DATABASE_URL: *** SET ***
📥 Importing routes and middleware...
✅ All imports completed successfully
✅ Registering /health endpoint...
✅ Registering /healthz endpoint...
🚀 Server running on port <PORT>
🌐 Listening on 0.0.0.0:<PORT>
✅ Health check available at http://localhost:<PORT>/health
```

### Крок 5: Перевірте health check

Відкрийте у браузері:
```
https://your-app.railway.app/health
```

Повинні побачити:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-01T...",
  "uptime": 123.456,
  "port": 5000
}
```

---

## 🔧 Створення адміністратора (seed)

Після успішного деплою виконайте seed для створення адміністратора:

### Варіант 1: Через Railway Shell
1. Відкрийте **Shell** в Railway Dashboard
2. Виконайте:
```bash
npm run seed
```

### Варіант 2: Через Railway CLI (локально)
```bash
# Встановіть CLI якщо ще немає
npm install -g @railway/cli

# Увійдіть
railway login

# Виконайте seed
railway run npm run seed
```

---

## 🐛 Відладка

### Проблема 1: Healthcheck все ще fail'иться

**Перевірте Deploy Logs:**
- Шукайте `📦 DATABASE_URL: ❌ NOT SET`
- Шукайте помилки підключення до БД

**Якщо `DATABASE_URL` не встановлено:**
1. Переконайтеся, що PostgreSQL додано у проект
2. Додайте `DATABASE_URL` у Variables

### Проблема 2: Prisma migrate fails

**Перевірте схему БД:**
```bash
# В Railway Shell
npx prisma migrate deploy
```

**Якщо є помилки міграції:**
```bash
# В Railway Shell
npx prisma migrate resolve --applied "<migration-name>"
```

### Проблема 3: PORT не визначається

**Перевірте логи:**
Повинно бути: `📦 PORT: <число>`

**Перевірте Dockerfile:**
Переконайтеся, що немає `ENV PORT=5000`

---

## ✅ Чекліст успішного деплою

- [ ] Зміни закоммічені і запушені в GitHub
- [ ] PostgreSQL база додана в Railway
- [ ] `DATABASE_URL` є у Variables
- [ ] `JWT_SECRET` встановлено (мінімум 32 символи)
- [ ] `ADMIN_PASSWORD` встановлено (мінімум 12 символів)
- [ ] Deploy Logs показують `DATABASE_URL: *** SET ***`
- [ ] Health check endpoint повертає 200 OK
- [ ] Сайт відкривається по домену Railway

---

## 📊 Очікуваний час запуску

| Етап | Час |
|------|-----|
| Build Docker image | 2-5 хв |
| Prisma migrate deploy | 10-30 сек |
| Server startup | 5-10 сек |
| Health check pass | 10-60 сек |
| **Разом** | **3-7 хв** |

---

## 🔗 Корисні посилання

- [Railway Variables](https://docs.railway.app/deployments/variables)
- [Railway Healthchecks](https://docs.railway.app/deployments/healthchecks)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)
- [Prisma Deploy to Production](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/deployment-to-production)

---

**Дата виправлення**: 1 березня 2026 р.  
**Розробник**: GoodsXP Team
