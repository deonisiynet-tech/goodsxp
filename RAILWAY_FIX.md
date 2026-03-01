# ✅ GoodsXP - Исправления для Railway

## Внесенные изменения

### 1. Dockerfile
- Добавлен `wget` для health checks (совместимость с Alpine Linux)
- Prisma Client генерируется автоматически при сборке
- `ENV PORT=5000` - значение по умолчанию (Railway переопределяет)
- HEALTHCHECK использует `http://localhost:5000/health`
- Убрана команда `seed` из CMD (может выполняться вручную при необходимости)

### 2. .railway.json
- Добавлен `startCommand`: `npx prisma migrate deploy && node dist/server.js`
- Health check path: `/health`
- Health check timeout: 300 секунд
- Initial delay: 10 секунд

### 3. railway.toml
- Синхронизирован с .railway.json
- Добавлен `startCommand`
- Добавлены watch paths для отслеживания изменений

### 4. server/src/server.ts
- Health check endpoint `/health` определен ДО импорта API маршрутов
- Добавлен резервный endpoint `/healthz`
- CORS настроен для `healthcheck.railway.app` hostname
- Сервер слушает на `0.0.0.0:${PORT}`
- `PORT` преобразуется в число: `Number(process.env.PORT)`
- Добавлены логи для отладки запуска

---

## ✅ Проверка по пунктам Railway

| Пункт | Статус | Реализация |
|-------|--------|------------|
| **1. Конфигурация порта** | ✅ | `Number(process.env.PORT) || 5000` |
| **2. Привязка к хосту** | ✅ | `app.listen(PORT, '0.0.0.0', ...)` |
| **3. Health Check Path** | ✅ | `/health` и `/healthz` endpoints |
| **4. HTTPS/SSL редирект** | ✅ | Нет принудительного редиректа |
| **5. Тайм-аут** | ✅ | `healthcheckTimeout: 300` (5 минут) |
| **6. Start Command** | ✅ | `npx prisma migrate deploy && node dist/server.js` |

---

## 🚀 Инструкция по деплою

### 1. Закоммитьте изменения в Git
```bash
cd c:\Users\User\Desktop\shop-mvp
git add .
git commit -m "Fix: Railway health check"
git push origin main
```

### 2. Проверьте переменные окружения в Railway Dashboard

Перейдите в **Variables** вашего проекта на Railway и убедитесь, что установлены:

| Переменная | Значение |
|------------|----------|
| `NODE_ENV` | `production` |
| `PORT` | (Railway инжектит автоматически) |
| `DATABASE_URL` | (автоматически из PostgreSQL) |
| `JWT_SECRET` | ваш секретный ключ (минимум 32 символа) |
| `JWT_EXPIRES_IN` | `7d` |
| `ADMIN_EMAIL` | `goodsxp.net@gmail.com` |
| `ADMIN_PASSWORD` | ваш пароль администратора |
| `CLIENT_URL` | `${{RAILWAY_PUBLIC_DOMAIN}}` |

### 3. Увеличьте тайм-аут (если нужно)

Если приложение долго запускается, добавьте переменную:

| Переменная | Значение |
|------------|----------|
| `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` | `600` (10 минут) |

### 4. Задеплойте изменения

Railway автоматически задеплоит изменения после push в GitHub.

**Или вручную:** Railway Dashboard → Deploy → Restart Deployment

### 5. Проверьте логи

Откройте **Deploy Logs** в Railway и убедитесь, что:
1. ✅ Сборка прошла успешно
2. ✅ Prisma migrate deploy выполнился
3. ✅ Server running on port ${PORT}
4. ✅ Health check available at http://localhost:${PORT}/health

### 6. Проверьте health check

Откройте в браузере: `https://your-app.railway.app/health`

Должны увидеть:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-01T..."
}
```

Или альтернативный: `https://your-app.railway.app/healthz`
```
OK
```

---

## 🔧 Создание администратора (seed)

После деплоя выполните команду для создания администратора:

```bash
# В Railway Dashboard -> Shell
npm run seed
```

Или создайте вручную через Prisma Studio:
```bash
npx prisma studio
```

---

## 🐛 Отладка

Если health check все еще не работает:

### 1. Проверьте Deploy Logs
Railway Dashboard → Deploy Logs

Ищите сообщения:
- ✅ `Server running on port XXXX`
- ✅ `Health check available at http://localhost:XXXX/health`

### 2. Проверьте переменные окружения
Убедитесь, что `DATABASE_URL` установлен и корректен

### 3. Проверьте Prisma
Убедитесь, что миграции выполнены:
```bash
# В Railway Shell
npx prisma migrate deploy
```

### 4. Увеличьте timeout
Добавьте переменную окружения:
```
RAILWAY_HEALTHCHECK_TIMEOUT_SEC=600
```

### 5. Проверьте CORS
Убедитесь, что `healthcheck.railway.app` разрешен в CORS

### 6. Временно отключите health check
Чтобы проверить, работает ли приложение:
1. Railway Dashboard → Settings → Healthchecks
2. Удалите путь health check
3. Сохраните
4. Если сайт запустился - проблема в настройках проверки

---

## 📋 Чеклист перед деплоем

- [ ] Изменения закоммичены и запушены в GitHub
- [ ] PostgreSQL база данных подключена в Railway
- [ ] Переменные окружения установлены в Railway Dashboard
- [ ] `JWT_SECRET` установлен (минимум 32 символа)
- [ ] `ADMIN_EMAIL` и `ADMIN_PASSWORD` установлены
- [ ] Watch Paths настроены: `/server/**`, `/Dockerfile`, `/.railway.json`
- [ ] Миграции Prisma выполнены (автоматически при деплое)

---

## ⚡ Быстрая проверка локально

```bash
# Локальная проверка Dockerfile
docker build -t goodsxp-server .
docker run -p 5000:5000 goodsxp-server

# Проверка health check
curl http://localhost:5000/health
curl http://localhost:5000/healthz
```

---

## 📚 Документация Railway

- [Healthchecks](https://docs.railway.app/deployments/healthchecks)
- [PORT variable](https://docs.railway.app/deployments/healthchecks#configure-the-healthcheck-port)
- [Hostname](https://docs.railway.app/deployments/healthchecks#healthcheck-hostname)
- [Timeouts](https://docs.railway.app/deployments/healthchecks#healthcheck-timeout)

---

**Дата исправления**: 1 марта 2026 г.  
**Разработчик**: GoodsXP Team
