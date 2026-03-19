# 🐳 Исправление Docker build ошибки - Prisma Schema Not Found

## ❌ Проблема

```
Error: Could not find Prisma Schema that is required for this command.
...
Checked following paths:
schema.prisma: file not found
prisma/schema.prisma: file not found
```

**Причина:** В Dockerfile схема Prisma копировалась ПОСЛЕ выполнения `npm install`, но скрипт `postinstall` пытается выполнить `prisma generate`, который требует схему.

---

## ✅ Что исправлено

### 1. Обновлён `server/package.json`

**Изменения:**
- Добавлен `--schema ./prisma/schema.prisma` в `postinstall`
- Добавлено `"schema": "./prisma/schema.prisma"` в секцию `prisma`

```json
{
  "scripts": {
    "postinstall": "prisma generate --schema ./prisma/schema.prisma"
  },
  "prisma": {
    "schema": "./prisma/schema.prisma"
  }
}
```

### 2. Обновлён `Dockerfile`

**Изменения:**
- Схема копируется ДО `npm install`
- `postinstall` теперь может найти схему

```dockerfile
# Copy server package files
COPY server/package*.json ./

# Copy Prisma schema BEFORE npm install (needed for postinstall script)
COPY server/prisma ./prisma

# Install ALL dependencies (postinstall will run prisma generate)
RUN npm install
```

### 3. Обновлён `.dockerignore`

**Изменения:**
- Разрешено копирование `server/.env` для сборки

---

## 🚀 Применение исправлений

### 1. Закоммитьте изменения

```bash
git add Dockerfile server/package.json .dockerignore
git commit -m "fix: Prisma schema location for Docker build"
git push
```

### 2. Railway автоматически задеплоит

После пуша Railway автоматически запустит новый билд.

---

## ✅ Проверка

После деплоя проверьте логи:

```
server-builder
RUN npm install
✅ Prisma Client generated successfully
```

И сервер должен запуститься без ошибок:

```
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma..."]
✅ Database synced
Server running on port 5000
```

---

## 📁 Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `Dockerfile` | Схема копируется ДО npm install |
| `server/package.json` | Добавлен `--schema` в postinstall |
| `.dockerignore` | Разрешено копирование server/.env |

---

## 🔧 Локальная проверка Docker сборки

```bash
# Очистите кэш Docker
docker builder prune -f

# Соберите образ
docker build -t shop-mvp .

# Запустите контейнер
docker run -p 5000:5000 shop-mvp
```

---

## 🐛 Если ошибка повторяется

### Проверьте что схема существует

```bash
ls -la server/prisma/schema.prisma
```

### Проверьте postinstall

```bash
cd server
cat package.json | grep postinstall
# Должно быть: "postinstall": "prisma generate --schema ./prisma/schema.prisma"
```

### Попробуйте вручную

```bash
cd server
npm install --ignore-scripts
npx prisma generate --schema ./prisma/schema.prisma
```

---

**После этих изменений Docker билд должен проходить без ошибок Prisma.**
