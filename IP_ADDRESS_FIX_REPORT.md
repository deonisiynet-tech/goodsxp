# Звіт: Виправлення визначення IP адреси користувача

**Дата:** 2026-04-30  
**Статус:** ✅ Завершено

---

## Проблема

Адмінка показувала неправильний IP користувача (наприклад, IP сервера або Лондон) у вкладці "Безпека" → Сесії.

**Причина:**  
Використовувався `req.ip` або `req.connection.remoteAddress`, що повертає IP проксі-сервера, а не реальний IP клієнта при роботі через CDN/проксі (Railway).

---

## Виконані зміни

### 1. ✅ Trust Proxy вже налаштовано
**Файл:** `server/src/server.ts:125`

```typescript
app.set('trust proxy', 1);
```

Налаштування довіряє одному проксі-шару (Railway load balancer).

---

### 2. ✅ Утиліта `getClientIp` вже існувала
**Файл:** `server/src/utils/getClientIp.ts`

Правильна логіка отримання IP:
1. `X-Forwarded-For` (перший IP у ланцюжку)
2. `X-Real-IP` (nginx)
3. `req.socket.remoteAddress` (fallback)
4. Нормалізація: видалення `::ffff:` префіксу, обробка localhost

---

### 3. ✅ Замінено `req.ip` на `getClientIp(req)` у всіх файлах

#### Оновлені файли:

**Контролери:**
- ✅ `server/src/controllers/auth.controller.ts` (2 місця)
- ✅ `server/src/controllers/admin.controller.ts` (7 місць)
- ✅ `server/src/controllers/order.controller.ts` (2 місця)
- ✅ `server/src/controllers/product.controller.ts` (5 місць)

**Middleware:**
- ✅ `server/src/middleware/auth.ts` (1 місце)
- ✅ `server/src/middleware/adminPanelPath.ts` (1 місце)
- ✅ `server/src/middleware/rateLimiter.ts` (4 rate limiters)

**Routes:**
- ✅ `server/src/routes/analytics.routes.ts` (1 місце)

**Сервіси:**
- ✅ `server/src/services/session.service.ts` — вже використовував `getClientIp(req)` ✓

---

## Результат

### До:
```typescript
const ip = req.ip || req.connection.remoteAddress || 'unknown';
```
❌ Повертає IP проксі-сервера (Лондон, Railway IP)

### Після:
```typescript
import { getClientIp } from '../utils/getClientIp.js';
const ip = getClientIp(req);
```
✅ Повертає реальний IP користувача з `X-Forwarded-For`

---

## Що це виправляє

1. ✅ **Адмінка "Безпека" → Сесії** — показує реальний IP користувача
2. ✅ **Rate limiting** — працює по реальному IP (запобігає обходу через проксі)
3. ✅ **Логування входів** — зберігає правильний IP у `LoginLog`
4. ✅ **Блокування IP** — блокує реальний IP зловмисника, а не проксі
5. ✅ **Аналітика відвідувачів** — коректна геолокація

---

## Перевірка

```bash
# Перевірити що не залишилось req.ip
cd server
grep -r "req\.ip\|remoteAddress" src/ --include="*.ts" | grep -v "getClientIp"
# Результат: 0 знайдено ✅
```

---

## Важливо

- **НЕ порушена** існуюча система сесій
- **НЕ змінено** логіку аутентифікації
- **НЕ потрібна** міграція бази даних
- **Сумісно** з існуючими сесіями

---

## Наступні кроки (опціонально)

Якщо потрібна геолокація по IP:
1. Додати сервіс геолокації (ipapi.co, ip-api.com)
2. Оновлювати `location` у `AdminSession` при створенні сесії
3. Показувати місто/країну в адмінці

---

**Статус:** Готово до деплою ✅
