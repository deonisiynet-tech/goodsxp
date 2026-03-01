# 🚀 Railway Deployment Recovery Plan

## Проблема
Код виправлений, health check працює, але Railway показує: **"1/1 replicas never became healthy"**

---

## 📋 План дій (виконувати по черзі)

### 🔹 Крок 1: Тест мінімального деплою (без БД)

**Мета**: Перевірити, чи Railway взагалі може задеплоїти ваш контейнер

1. Створіть новий сервіс на Railway (не редагуйте існуючий!)
2. Підключіть GitHub репозиторій
3. В налаштуваннях служби вкажіть:
   - **Root Directory**: `server`
   - **Start Command**: `npm run dev` (для тесту)
4. **НЕ додавайте базу даних**
5. Деплой

**Очікуваний результат**: Сервіс запуститься, `/health` поверне 200

---

### 🔹 Крок 2: Деплой з Dockerfile.minimal

**Мета**: Перевірити Docker деплой без міграцій

```bash
# Локальна перевірка
docker build -f Dockerfile.minimal -t goodsxp-minimal .
docker run -p 5000:5000 goodsxp-minimal
curl http://localhost:5000/health
```

Якщо працює локально:

1. В Railway Dashboard → Settings → Build
2. Змініть Dockerfile Path на `Dockerfile.minimal`
3. Restart Deployment

---

### 🔹 Крок 3: Очищення кешів Railway

**Мета**: Видалити старі кеші збірки

1. **Railway Dashboard → Settings**
2. **Deployments** → Знайдіть старі деплої
3. **Delete** всі старі деплої
4. **Settings → Build** → **Clear Build Cache**
5. **Restart Deployment**

---

### 🔹 Крок 4: Збільшення тайм-ауту

**Мета**: Дати серверу більше часу на запуск

Додайте змінні оточення в Railway Dashboard:

```
RAILWAY_HEALTHCHECK_TIMEOUT_SEC=600
RAILWAY_HEALTHCHECK_INITIAL_DELAY=30
```

В `.railway.json`:
```json
{
  "deploy": {
    "healthcheckTimeout": 600
  }
}
```

---

### 🔹 Крок 5: Деплой без Dockerfile (Native Node.js)

**Мета**: Використати нативний деплой Railway замість Docker

1. Видаліть або перейменуйте `Dockerfile` → `Dockerfile.bak`
2. В Railway Dashboard → Settings → Build:
   - **Builder**: `Nixpacks` (замість Dockerfile)
   - **Root Directory**: `server`
   - **Start Command**: `npx prisma migrate deploy && npm run start`
3. Restart Deployment

---

### 🔹 Крок 6: Новий сервіс з чистого аркуша

**Мета**: Уникнути конфліктів volume/mount

1. **Створіть НОВИЙ проект на Railway** (не редагуйте старий!)
2. Назва: `goodsxp-v2`
3. Підключіть GitHub
4. Додайте PostgreSQL базу
5. Налаштуйте змінні оточення:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=(автоматично)
   JWT_SECRET=your-secret-key-min-32-chars
   ADMIN_EMAIL=goodsxp.net@gmail.com
   ADMIN_PASSWORD=your-admin-password
   CLIENT_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   ```
6. Деплой

---

### 🔹 Крок 7: Перевірка hostname для CORS

**Мета**: Дозволити запити від `healthcheck.railway.app`

В `server/src/server.ts` вже додано:
```typescript
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://healthcheck.railway.app',
  '*',
];
```

Переконайтеся, що це закоммічено і запушено!

---

### 🔹 Крок 8: Використання recovery script

```bash
cd c:\Users\User\Desktop\shop-mvp

# Запустіть script (Linux/Mac)
bash scripts/railway-recovery.sh

# Або вручну (Windows)
cd server
npm install
npx prisma generate
npm run build
cd ..

git add .
git commit -m "fix: deployment recovery"
git push origin main
```

Після push: Railway Dashboard → Deploy → Restart Deployment

---

### 🔹 Крок 9: Тимчасове вимкнення health check

**Мета**: Перевірити, чи сервер взагалі запускається

1. Railway Dashboard → Settings → Healthchecks
2. **Видаліть** Healthcheck Path
3. Збережіть
4. Restart Deployment
5. Зачекайте 2 хвилини
6. Спробуйте відкрити: `https://your-app.railway.app/health`

Якщо працює → проблема в налаштуваннях health check, а не в коді.

---

### 🔹 Крок 10: Ручна міграція через Railway Shell

Якщо сервер запускається, але міграції падають:

1. Railway Dashboard → Shell
2. Виконайте:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
3. Перезапустіть деплой

---

## 🎯 Альтернативні рішення

### A. Використання іншого провайдера

Якщо Railway продовжує падати:

| Провайдер | Переваги |
|-----------|----------|
| **Render** | Безкоштовний тариф, простіший деплой |
| **Fly.io** | Більше контролю, близько до Railway |
| **Railway (V2)** | Нова версія платформи |
| **Vercel + Neon** | Для Next.js + PostgreSQL |

### B. Деплой тільки бекенду

1. Деплойті тільки `server` на Railway
2. Клієнт (Next.js) деплойті на Vercel
3. Це зменшить навантаження на контейнер

---

## 📊 Чекліст успішного деплою

- [ ] Код закоммічений і запушений
- [ ] Змінні оточення встановлені
- [ ] База даних підключена
- [ ] Health check endpoint існує
- [ ] CORS дозволяє `healthcheck.railway.app`
- [ ] Тайм-аут збільшено до 600с
- [ ] Кеші очищені
- [ ] Старі деплої видалені

---

## 🐛 Діагностика

### Логи для перевірки

1. **Deploy Logs** (не Build Logs!)
   - Шукайте: `Server running on port XXXX`
   - Шукайте: `Health check available at /health`

2. **Якщо бачите**: `Prisma Client is not generated`
   - Рішення: `npx prisma generate` в Dockerfile

3. **Якщо бачите**: `Cannot connect to database`
   - Рішення: Перевірте DATABASE_URL

4. **Якщо бачите**: `Health check failed: connection refused`
   - Рішення: Сервер не слухає 0.0.0.0

---

## 📞 Коли звертатися в підтримку Railway

Якщо всі кроки вище не допомогли:

1. Відкрийте ticket на https://railway.app/help
2. Додайте:
   - Посилання на проект
   - Deploy Logs
   - Скріншот помилки
   - Опис кроків які вже спробували

---

**Дата**: 1 березня 2026  
**Проект**: GoodsXP
