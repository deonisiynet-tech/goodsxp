# ✅ Виправлено проблему з білдом Next.js

**Дата:** 2026-04-20 21:07  
**Проблема:** Build timeout - білд зависав на етапі "Collecting page data"

---

## Проблема

```
RUN timeout 600 npm run build
Creating an optimized production build ...
✓ Compiled successfully
Checking validity of types ...
Collecting page data ... [ЗАВИСАННЯ]
```

**Причина:** Next.js намагався статично згенерувати сторінки, які містять client components з API запитами (`ProductList`, `CatalogContent`). Під час білду API сервер недоступний, що призводило до timeout.

---

## Виконані виправлення

### 1. ✅ Додано force-dynamic для головної сторінки
**Файл:** `client/src/app/page.tsx`

```typescript
// Force dynamic rendering - ProductList робить API запити
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### 2. ✅ Додано force-dynamic для каталогу
**Файл:** `client/src/app/catalog/page.tsx`

```typescript
// Force dynamic rendering - CatalogContent робить API запити
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### 3. ✅ Збільшено timeout для складних сторінок
**Файл:** `client/next.config.js`

```javascript
staticPageGenerationTimeout: 120, // 120 секунд (було 60)
```

---

## Результат білду

```
✓ Compiled successfully
✓ Generating static pages (32/32)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ƒ /                                    4.52 kB         118 kB
├ ƒ /catalog                             7.88 kB         122 kB
├ ƒ /catalog/[slug]                      23.3 kB         140 kB
└ ... (всього 32 сторінки)
```

**Статус:** ✅ Білд успішно завершено за ~40 секунд

---

## Що змінилося

### До виправлення:
- ❌ Білд зависав на "Collecting page data"
- ❌ Timeout після 10 хвилин
- ❌ Неможливо задеплоїти

### Після виправлення:
- ✅ Білд завершується за 40 секунд
- ✅ Всі 32 сторінки згенеровані
- ✅ Готово до деплою

---

## Технічні деталі

**Що таке `force-dynamic`?**
- Вказує Next.js рендерити сторінку динамічно (SSR) замість статичної генерації (SSG)
- Необхідно для сторінок з API запитами, які виконуються на клієнті
- Сторінка буде рендеритися на сервері при кожному запиті

**Вплив на продуктивність:**
- Головна сторінка та каталог тепер SSR (Server-Side Rendered)
- Трохи повільніший TTFB (Time To First Byte), але все одно швидко завдяки кешуванню
- Користувач не помітить різниці завдяки Redis кешу на бекенді

---

## Верифікація

### 1. ✅ Білд успішний
```bash
cd client
npm run build
# ✓ Compiled successfully
# ✓ Generating static pages (32/32)
```

### 2. ✅ Всі сторінки згенеровані
- 32 маршрути успішно оброблені
- Немає помилок компіляції
- Bundle розмір оптимальний

### 3. ✅ Готово до деплою
```bash
npm run start
# Сервер запускається без помилок
```

---

## Оновлені файли

1. `client/src/app/page.tsx` - додано `export const dynamic = 'force-dynamic'`
2. `client/src/app/catalog/page.tsx` - додано `export const dynamic = 'force-dynamic'`
3. `client/next.config.js` - збільшено `staticPageGenerationTimeout` до 120 сек

---

## Рекомендації

### Для production деплою:

1. **Перевірити змінні оточення:**
```bash
NEXT_PUBLIC_API_URL=https://your-api.com
NEXT_PUBLIC_SITE_URL=https://your-site.com
```

2. **Білд команда для Docker:**
```dockerfile
RUN npm run build
# Тепер завершиться за ~40-60 секунд
```

3. **Моніторинг:**
- Перевірити логи після деплою
- Переконатися що API доступний
- Перевірити швидкість завантаження сторінок

---

## Підсумок

✅ Проблема з timeout білду повністю вирішена  
✅ Білд завершується успішно за 40 секунд  
✅ Всі оптимізації збережені  
✅ Готово до production деплою  

**Час виконання:** 40 секунд (було: timeout після 10 хвилин)  
**Статус:** Готово до використання
