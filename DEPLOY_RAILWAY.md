# Деплой на Railway

## Быстрый старт

### 1. Установите Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Войдите в аккаунт
```bash
railway login
```

### 3. Создайте новый проект
```bash
railway init
```

### 4. Добавьте базу данных PostgreSQL
```bash
railway add postgres
```

### 5. Добавьте Redis (опционально)
```bash
railway add redis
```

### 6. Задеплойте
```bash
railway up
```

## Переменные окружения

Railway автоматически inject'ит переменные:
- `DATABASE_URL` — подключается к PostgreSQL
- `REDIS_URL` — подключается к Redis
- `RAILWAY_PUBLIC_DOMAIN` — домен вашего приложения

### Нужно задать вручную в Railway Dashboard:
1. Откройте проект на [railway.app](https://railway.app)
2. Перейдите в **Variables**
3. Добавьте:
   - `JWT_SECRET` — ваш секретный ключ
   - `ADMIN_EMAIL` — email администратора
   - `ADMIN_PASSWORD` — пароль администратора
   - `CLOUDINARY_*` — если используете Cloudinary

## Локальная проверка

```bash
# Проверка конфигурации
railway run npm run prisma:generate

# Локальный запуск с переменными Railway
railway run npm run dev
```

## Ссылки

- [Railway Docs](https://docs.railway.app)
- [PostgreSQL на Railway](https://docs.railway.app/databases/postgresql)
- [Redis на Railway](https://docs.railway.app/databases/redis)
