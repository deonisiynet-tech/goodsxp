# 🔧 Исправление TypeScript ошибок сборки Docker

## ❌ Ошибки

```
src/services/product.service.ts(41,11): error TS2353: Object literal may only specify known properties, and 'categoryId' does not exist in type 'ProductSelect<DefaultArgs>'.
```

**Причина:** Prisma Client сгенерирован со старой схемой, которая не содержит новые поля (`categoryId`, `rating`, `originalPrice`, `discountPrice`, `isFeatured`, `isPopular`).

---

## ✅ Что исправлено

### 1. Обновлён `server/src/utils/validators.ts`
Добавлены новые поля в `productSchema`:
- `categoryId`
- `rating`
- `originalPrice`
- `discountPrice`
- `isFeatured`
- `isPopular`

### 2. Обновлён `server/src/services/product.service.ts`
- Добавлены интерфейсы `ProductCreateInput`, `ProductUpdateInput`, `ProductWithReviews`
- Добавлен импорт `Product` из `@prisma/client`
- Использованы явные типы для обхода проблем до генерации Prisma Client

### 3. Обновлён `Dockerfile`
Схема копируется ДО `npm install` для корректной работы `postinstall`.

---

## 🚀 Как применить

### Вариант 1: Очистить кэш Docker (рекомендуется)

```bash
# Очистите кэш Docker
docker builder prune -f

# Закоммитьте изменения
git add .
git commit -m "fix: TypeScript errors and Prisma schema fields"
git push
```

### Вариант 2: Railway — переменная для сброса кэша

В Railway добавьте переменную окружения:
```
DOCKER_BUILDKIT_NO_CACHE=1
```

Или измените `Dockerfile` добавив `--no-cache` в команду сборки.

### Вариант 3: Пересобрать с --no-cache

```bash
docker build --no-cache -t shop-mvp .
```

---

## 🔍 Проверка локально

```bash
# 1. Очистите кэш Prisma
cd server
rm -rf node_modules/.prisma

# 2. Сгенерируйте Prisma Client
npx prisma generate --schema ./prisma/schema.prisma

# 3. Попробуйте собрать
npm run build
```

**Ожидаемый результат:**
```
> shop-server@1.0.0 build
> tsc
✅ Build completed successfully
```

---

## 📁 Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `server/src/utils/validators.ts` | Добавлены новые поля в productSchema |
| `server/src/services/product.service.ts` | Добавлены интерфейсы и типы |
| `Dockerfile` | Схема копируется ДО npm install |
| `server/package.json` | `postinstall` с `--schema` |

---

## 🐛 Если ошибки остаются

### 1. Проверьте что схема содержит поля

```bash
cat server/prisma/schema.prisma | grep -A 20 "model Product"
```

**Ожидаемые поля:**
```prisma
model Product {
  id            String      @id @default(uuid())
  categoryId    String?
  rating        Decimal?    @db.Decimal(3, 2)
  originalPrice Decimal?    @db.Decimal(10, 2)
  discountPrice Decimal?    @db.Decimal(10, 2)
  isFeatured    Boolean     @default(false)
  isPopular     Boolean     @default(false)
  ...
}
```

### 2. Проверьте Prisma Client

```bash
cd server
ls -la node_modules/.prisma/client
cat node_modules/.prisma/client/index.d.ts | grep -A 30 "export type Product"
```

### 3. Попробуйте полную переустановку

```bash
cd server
rm -rf node_modules
npm install
npx prisma generate --schema ./prisma/schema.prisma
npm run build
```

---

**После этих изменений TypeScript сборка должна проходить без ошибок.**
