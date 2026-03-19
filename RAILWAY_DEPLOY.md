# 🚀 RAILWAY ДЕПЛОЙ — ІНСТРУКЦІЯ

**Дата:** 19 березня 2026  
**Статус:** ✅ ГОТОВО

---

## ✅ ЩО ВЖЕ ЗРОБЛЕНО

1. ✅ **Dockerfile налаштовано** — міграція виконується автоматично
2. ✅ **railway.json оновлено** — правильний start command
3. ✅ **Нова міграція створена** — без помилок BEGIN/COMMIT
4. ✅ **Prisma Client згенеровано** — v7.5.0

---

## 📋 ЯК ЗАДЕПЛОЇТИ

### Крок 1: Push до Git

```bash
git add .
git commit -m "fix: нова міграція бази + Dockerfile з migrate deploy"
git push origin main
```

### Крок 2: Railway автоматично задеплоїть

Після push, Railway автоматично:
1. Збере Docker image
2. Запустить міграцію: `prisma migrate deploy`
3. Запустить сервер: `node dist/server.js`

**Нічого більше робити не потрібно!**

---

## 🔍 ЯК ПЕРЕВІРИТИ ДЕПЛОЙ

### 1. Перейдіть на Railway Dashboard

[https://railway.app](https://railway.app)

### 2. Оберіть ваш проект

### 3. Перевірте Deployment

- **Status:** має бути "SUCCESS"
- **Logs:** маєте побачити:
  ```
  ✔ Generated Prisma Client
  Applied migration '20260319120000_init'
  Server running on port 5000
  ```

### 4. Перевірте API

```bash
# Health check
GET https://your-app.railway.app/health

# Товари
GET https://your-app.railway.app/api/products

# Адмінка (після логіну)
GET https://your-app.railway.app/api/admin/stats
```

---

## ⚠️ ЯК ЩОСЬ ПІШЛО НЕ ТАК

### Помилка: "Relation 'User' already exists"

**Причина:** Таблиці вже існують в базі.

**Рішення:** Міграція використовує `IF NOT EXISTS`, тому це не помилка.
Перевірте логи — міграція має успішно завершитись.

### Помилка: "syntax error at or near 'BEGIN'"

**Причина:** Стара міграція ще в базі.

**Рішення:**
1. Видаліть стару міграцію з Railway Dashboard → Variables
2. Або очистіть таблицю міграцій:

```bash
# Через Railway CLI
railway run psql -c "DELETE FROM \"_prisma_migrations\";"

# Або через pgAdmin/DBeaver підключіться до БД
```

### Помилка: "Prisma Client not generated"

**Причина:** Prisma Client не згенерувався під час build.

**Рішення:** Dockerfile вже має `prisma generate` в build процесі.
Перевірте логи build — має бути:
```
✔ Generated Prisma Client (v7.5.0)
```

---

## 🔄 ЯК ПЕРЕЗАПУСТИТИ

### Через Railway Dashboard:

1. Оберіть ваш проект
2. Натисніть **Deployments**
3. Натисніть **⋮** (три крапки)
4. Оберіть **Restart**

### Через Railway CLI:

```bash
railway restart
```

---

## 📊 ЗМІНИ В ПРОЕКТІ

### Файли які працюють на деплой:

| Файл | Призначення |
|------|-------------|
| `Dockerfile` | Build + міграція + запуск сервера |
| `railway.json` | Конфігурація для Railway |
| `server/prisma/schema.prisma` | Схема бази даних |
| `server/prisma/migrations/20260319120000_init/migration.sql` | Міграція |

### Як працює Dockerfile:

```dockerfile
# 1. Build сервера + генерація Prisma Client
FROM node:20-alpine AS server-builder
RUN npx prisma generate --schema=./prisma/schema.prisma

# 2. Build клієнта (Next.js)
FROM node:20-alpine AS client-builder
RUN npm run build

# 3. Production image
FROM node:20-alpine AS runner
# Копіює build files
# Запускає міграцію + сервер
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

---

## ✅ CHECKLIST ПЕРЕД ДЕПЛОЕМ

- [ ] Git push зроблено
- [ ] Зміни закоммічено: `git commit -m "fix: migration fix"`
- [ ] Railway Dashboard показує активний деплой
- [ ] Логи показують успішну міграцію
- [ ] Health check повертає 200
- [ ] API /products працює
- [ ] Адмінка працює

---

## 🎯 ПІСЛЯ ДЕПЛОЮ

### 1. Створіть адміна (якщо потрібно)

```bash
POST https://your-app.railway.app/api/admin/auth/login
{
  "email": "goodsxp.net@gmail.com",
  "password": "Admin123"
}
```

### 2. Перевірте товари

```bash
GET https://your-app.railway.app/api/products
```

### 3. Перевірте адмінку

```bash
GET https://your-app.railway.app/api/admin/stats
Cookie: admin-token=<token>
```

---

## 🆘 ЯК ПОТРІБНА ДОПОМОГА

Якщо щось не працює:

1. **Перевірте логи** на Railway Dashboard
2. **Перевірте змінні оточення**:
   - `DATABASE_URL` — має бути правильним
   - `JWT_SECRET` — має бути встановлено
   - `CLOUDINARY_*` — для завантаження зображень

3. **Напишіть помилку** — я допоможу виправити

---

*Інструкція оновлена: 19 березня 2026*
