# ✅ Исправления для Railway Healthcheck

## 📋 Что было исправлено

### 1. **Dockerfile**
- ✅ Убрано `ENV PORT=5000` (Railway сам инжектит PORT)
- ✅ HEALTHCHECK теперь использует `${PORT:-5000}` для динамического порта
- ✅ Добавлен `--skip-generate` к prisma migrate для оптимизации

### 2. **.railway.json**
- ✅ Добавлен `dockerfilePath: "Dockerfile"`
- ✅ Увеличен `healthcheckTimeout` до 600 секунд
- ✅ Добавлен `initialDelay: 60` (вместо 30)
- ✅ Добавлены `interval: 30` и `retries: 3`

### 3. **railway.toml**
- ✅ Синхронизирован с .railway.json
- ✅ Добавлена секция `[healthcheck]`
- ✅ Увеличен timeout до 600 секунд

### 4. **server/src/server.ts**
- ✅ Улучшен healthcheck endpoint (добавлены uptime и port)
- ✅ Добавлена обработка ошибок сервера (`.on('error')`)
- ✅ Добавлена обработка `uncaughtException` и `unhandledRejection`
- ✅ Улучшен graceful shutdown

### 5. **server/.env.railway**
- ✅ Убрано `PORT=5000` (Railway сам инжектит)
- ✅ Обновлён JWT_SECRET на более безопасный
- ✅ Добавлены комментарии для переменных

---

## 🚀 Инструкция по деплою

### Шаг 1: Закоммитьте изменения

```bash
cd c:\Users\User\Desktop\shop-mvp
git add .
git commit -m "Fix: Railway healthcheck configuration and error handling"
git push origin main
```

### Шаг 2: Проверьте переменные окружения в Railway Dashboard

1. Откройте ваш проект на [railway.app](https://railway.app)
2. Перейдите в **Variables**
3. Убедитесь, что установлены следующие переменные:

| Переменная | Значение | Обязательно |
|------------|----------|-------------|
| `NODE_ENV` | `production` | ✅ |
| `DATABASE_URL` | (автоматически из PostgreSQL) | ✅ |
| `JWT_SECRET` | `goodsxp-super-secret-jwt-key-2026-change-this-in-production` | ✅ |
| `ADMIN_EMAIL` | `goodsxp.net@gmail.com` | ✅ |
| `ADMIN_PASSWORD` | ваш надёжный пароль (минимум 12 символов) | ✅ |
| `CLIENT_URL` | `${{RAILWAY_PUBLIC_DOMAIN}}` | ✅ |

### Шаг 3: Проверьте настройки Railway

1. Откройте **Settings** вашего сервиса
2. Убедитесь, что:
   - **Root Directory**: пусто (используем Dockerfile)
   - **Build Command**: автоматически из Dockerfile
   - **Start Command**: автоматически из Dockerfile
   - **Healthcheck Path**: `/health`
   - **Healthcheck Timeout**: 600
   - **Healthcheck Initial Delay**: 60

### Шаг 4: Задеплойте изменения

Railway автоматически задеплоит после push в GitHub.

Или вручную: **Railway Dashboard → Deployments → Restart Deployment**

### Шаг 5: Проверьте логи

Откройте **Deploy Logs** и убедитесь, что видите:

```
🔧 Loading environment variables...
📦 NODE_ENV: production
📦 PORT: <число>
📦 DATABASE_URL: ***
✅ All imports completed successfully
✅ Registering /health endpoint...
✅ Registering /healthz endpoint...
🚀 Server running on port <PORT>
🌐 Listening on 0.0.0.0:<PORT>
✅ Health check available at http://localhost:<PORT>/health
```

### Шаг 6: Проверьте health check

Откройте в браузере:
```
https://your-app.railway.app/health
```

Должны увидеть:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-01T...",
  "uptime": 123.456,
  "port": 5000
}
```

Или альтернативный:
```
https://your-app.railway.app/healthz
```
Должны увидеть: `OK`

---

## 🔧 Создание администратора (seed)

После успешного деплоя выполните seed для создания администратора:

### Вариант 1: Через Railway Shell
1. Откройте **Shell** в Railway Dashboard
2. Выполните:
```bash
npm run seed
```

### Вариант 2: Через Railway CLI (локально)
```bash
# Установите CLI если ещё нет
npm install -g @railway/cli

# Войдите
railway login

# Выполните seed
railway run npm run seed
```

---

## 🐛 Отладка

### Проблема 1: Healthcheck всё ещё fails

**Проверьте Deploy Logs:**
- Ищите ошибки подключения к БД
- Ищите ошибки Prisma migrate

**Проверьте DATABASE_URL:**
- Убедитесь, что PostgreSQL подключен в Railway
- Проверьте что DATABASE_URL корректен

**Увеличьте timeout:**
Добавьте переменную окружения:
```
RAILWAY_HEALTHCHECK_TIMEOUT_SEC=600
```

**Временно отключите healthcheck:**
1. Railway Dashboard → Settings → Healthchecks
2. Удалите путь health check
3. Сохраните
4. Если сайт запустился — проблема в настройках проверки

### Проблема 2: Prisma migrate fails

**Проверьте схему БД:**
```bash
# В Railway Shell
npx prisma migrate deploy
```

**Если есть ошибки миграции:**
```bash
# В Railway Shell
npx prisma migrate resolve --applied "<migration-name>"
```

### Проблема 3: PORT не определяется

**Проверьте логи:**
Должно быть: `📦 PORT: <число>`

**Проверьте Dockerfile:**
Убедитесь, что нет `ENV PORT=5000` (только `ENV NODE_ENV=production`)

---

## ✅ Чеклист успешного деплоя

- [ ] Изменения закоммичены и запушены в GitHub
- [ ] PostgreSQL база подключена в Railway
- [ ] Переменные окружения установлены в Railway Dashboard
- [ ] `JWT_SECRET` установлен (минимум 32 символа)
- [ ] `ADMIN_PASSWORD` установлен (минимум 12 символов)
- [ ] Deploy Logs показывают успешный запуск сервера
- [ ] Health check endpoint возвращает 200 OK
- [ ] Сайт открывается по домену Railway

---

## 📊 Ожидаемое время запуска

| Этап | Время |
|------|-------|
| Build Docker image | 2-5 мин |
| Prisma migrate deploy | 10-30 сек |
| Server startup | 5-10 сек |
| Health check pass | 10-60 сек |
| **Итого** | **3-7 мин** |

---

## 🔗 Полезные ссылки

- [Railway Healthchecks Docs](https://docs.railway.app/deployments/healthchecks)
- [Railway PORT Variable](https://docs.railway.app/deployments/variables)
- [Railway Dockerfile Deploy](https://docs.railway.app/deployments/dockerfiles)
- [Prisma Deploy to Production](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/deployment-to-production)

---

**Дата исправления**: 1 марта 2026 г.  
**Разработчик**: GoodsXP Team
