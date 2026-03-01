# 🚨 КРИТИЧНО: Налаштування Railway

## ⚠️ Проблема

Healthcheck fail'иться, тому що сервер не запускається.

## 🔍 Причина

Railway **НЕ** використовує `.env` файли з вашого репозиторію!
Змінні оточення повинні бути встановлені в **Railway Dashboard**.

---

## ✅ Як виправити

### Крок 1: Відкрийте Railway Dashboard

1. Перейдіть на https://railway.app
2. Відкрийте ваш проект
3. Перейдіть у вкладку **Variables**

### Крок 2: Додайте змінні оточення

Додайте наступні змінні (кнопка **New Variable**):

| Змінна | Значення | Звідки взяти |
|--------|----------|--------------|
| `NODE_ENV` | `production` | Введіть вручну |
| `DATABASE_URL` | `postgresql://...` | Автоматично з PostgreSQL |
| `JWT_SECRET` | `goodsxp-super-secret-jwt-key-2026` | Введіть вручну |
| `ADMIN_EMAIL` | `goodsxp.net@gmail.com` | Введіть вручну |
| `ADMIN_PASSWORD` | ваш надійний пароль | Введіть вручну |
| `CLIENT_URL` | `${{RAILWAY_PUBLIC_DOMAIN}}` | Використайте змінну Railway |

### Крок 3: Перевірте PostgreSQL

1. У вашому проекті має бути додана **PostgreSQL база даних**
2. Якщо немає:
   - Натисніть **New** → **Database** → **PostgreSQL**
   - Railway автоматично створить базу і додасть `DATABASE_URL` у змінні

### Крок 4: Перезапустіть деплой

1. Перейдіть у вкладку **Deployments**
2. Натисніть **Restart Deployment**
3. Зачекайте 3-5 хвилин

---

## 🔍 Як перевірити

### 1. Перевірте Deploy Logs

У вкладці **Deployments** відкрийте логи поточного деплою.

Повинні побачити:
```
🔧 Loading environment variables...
📦 NODE_ENV: production
📦 PORT: 5000 (або інше число)
📦 DATABASE_URL: *** SET ***
📥 Importing routes and middleware...
✅ All imports completed successfully
✅ Registering /health endpoint...
🚀 Server running on port 5000
```

### 2. Перевірте Health Check

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

## 🐛 Поширені проблеми

### Проблема 1: DATABASE_URL не встановлено

**Симптоми:**
```
📦 DATABASE_URL: ❌ NOT SET
❌ FATAL: DATABASE_URL is not set!
```

**Рішення:**
1. Переконайтеся, що PostgreSQL додано у проект
2. Якщо додано, але `DATABASE_URL` немає у Variables:
   - Скопіюйте значення з PostgreSQL service
   - Додайте як змінну у Variables

### Проблема 2: Prisma migrate fails

**Симптоми:**
```
Error: Can't reach database server at `localhost:5432`
```

**Рішення:**
1. Переконайтеся, що використовується `DATABASE_URL` з Railway
2. Не використовуйте локальний `.env` для Railway

### Проблема 3: Порт не співпадає

**Симптоми:**
Healthcheck перевіряє один порт, а сервер слухає інший.

**Рішення:**
Railway автоматично встановлює `PORT`. Переконайтеся, що:
- У Dockerfile немає `ENV PORT=5000`
- Server.ts використовує `process.env.PORT`

---

## 📋 Чекліст

- [ ] PostgreSQL додано у проект Railway
- [ ] `DATABASE_URL` є у Variables
- [ ] `JWT_SECRET` встановлено (мінімум 32 символи)
- [ ] `ADMIN_PASSWORD` встановлено (мінімум 12 символів)
- [ ] `NODE_ENV=production` встановлено
- [ ] Деплой перезапущено після додавання змінних
- [ ] Deploy Logs показують `DATABASE_URL: *** SET ***`
- [ ] Health check повертає 200 OK

---

## 🔗 Корисні посилання

- [Railway Variables](https://docs.railway.app/deployments/variables)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)
- [Railway Healthchecks](https://docs.railway.app/deployments/healthchecks)

---

**Дата**: 1 березня 2026 р.
**Статус**: КРИТИЧНО
