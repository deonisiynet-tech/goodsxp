# ✅ GoodsXP - Исправления для Railway

## Внесенные изменения

### 1. Dockerfile
- Добавлен `wget` для health checks (совместимость с Alpine Linux)
- Prisma Client генерируется автоматически при сборке
- HEALTHCHECK использует `wget` вместо `node`
- Убрана команда `seed` из CMD (может выполняться вручную при необходимости)

### 2. .railway.json
- Добавлен `startCommand`: `npx prisma migrate deploy && node dist/server.js`
- Health check path: `/health`
- Health check timeout: 300 секунд

### 3. railway.toml
- Синхронизирован с .railway.json
- Добавлен `startCommand`

### 4. server/src/server.ts
- Health check endpoint `/health` определен ДО импорта API маршрутов
- Добавлены логи для отладки запуска
- Сервер слушает на `0.0.0.0:5000`

---

## 🚀 Инструкция по деплою

### 1. Закоммитьте изменения в Git
```bash
cd c:\Users\User\Desktop\shop-mvp
git add .
git commit -m "Fix: Railway health check and deployment configuration"
git push origin main
```

### 2. Проверьте переменные окружения в Railway Dashboard

Перейдите в **Variables** вашего проекта на Railway и убедитесь, что установлены:

| Переменная | Значение |
|------------|----------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DATABASE_URL` | (автоматически из PostgreSQL) |
| `JWT_SECRET` | ваш секретный ключ (минимум 32 символа) |
| `JWT_EXPIRES_IN` | `7d` |
| `ADMIN_EMAIL` | `goodsxp.net@gmail.com` |
| `ADMIN_PASSWORD` | ваш пароль администратора |
| `CLIENT_URL` | `${{RAILWAY_PUBLIC_DOMAIN}}` |

### 3. Задеплойте изменения

Railway автоматически задеплоит изменения после push в GitHub.

### 4. Проверьте логи

Откройте **Deploy Logs** в Railway и убедитесь, что:
1. ✅ Сборка прошла успешно
2. ✅ Prisma migrate deploy выполнился
3. ✅ Server running on port 5000
4. ✅ Health check available at http://localhost:5000/health

### 5. Проверьте health check

Откройте в браузере: `https://your-app.railway.app/health`

Должны увидеть:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-01T..."
}
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

1. **Проверьте логи**: Railway Dashboard → Deploy Logs
2. **Проверьте переменные окружения**: Убедитесь, что `DATABASE_URL` установлен
3. **Проверьте Prisma**: Убедитесь, что миграции выполнены
4. **Увеличьте timeout**: В `.railway.json` установите `healthcheckTimeout: 600`

---

## 📋 Чеклист перед деплоем

- [ ] Изменения закоммичены и запушены в GitHub
- [ ] PostgreSQL база данных подключена в Railway
- [ ] Переменные окружения установлены в Railway Dashboard
- [ ] `JWT_SECRET` установлен (минимум 32 символа)
- [ ] `ADMIN_EMAIL` и `ADMIN_PASSWORD` установлены
- [ ] Миграции Prisma выполнены (автоматически при деплое)

---

## ⚡ Быстрая проверка

```bash
# Локальная проверка Dockerfile
docker build -t goodsxp-server .
docker run -p 5000:5000 goodsxp-server

# Проверка health check
curl http://localhost:5000/health
```

---

**Дата исправления**: 1 марта 2026 г.
**Разработчик**: GoodsXP Team
