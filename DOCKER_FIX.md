# 🚀 Исправление ошибки Docker сборки

## Что было исправлено

### Проблема
Ошибка `Cannot convert undefined or null to object` в Edge Runtime возникала из-за отсутствия переменных окружения при сборке Docker образа.

### Решение
1. **Dockerfile** - добавлены переменные окружения `CLOUDINARY_*` и корректный `DATABASE_URL`
2. **next.config.mjs** - добавлена конфигурация `env` для передачи переменных и `server: 'node'`
3. **docker-compose.yml** - обновлён для использования единого Dockerfile
4. **.env** - создан файл с необходимыми переменными
5. **client/Dockerfile** - удалён (теперь используется корневой Dockerfile)

## Запуск

### 1. Запустите Docker Desktop
Убедитесь, что Docker Desktop запущен и работает.

### 2. Сборка и запуск
```bash
cd c:\Users\User\Desktop\shop-mvp
docker compose up --build
```

### 3. Доступ к приложению
- Frontend: http://localhost:5000
- API: http://localhost:5000/api
- Health check: http://localhost:5000/health

## Переменные окружения

Файл `.env` содержит:
- `DATABASE_URL` - PostgreSQL подключение
- `CLOUDINARY_*` - Cloudinary для загрузки изображений
- `JWT_SECRET` - секрет для JWT токенов
- `REDIS_URL` - Redis (опционально)

## Остановка
```bash
docker compose down
```

## Остановка с удалением данных
```bash
docker compose down -v
```
