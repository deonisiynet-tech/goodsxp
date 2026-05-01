# Міграція fetch → adminApi

## Швидкий гайд по заміні fetch на adminApi

### Крок 1: Імпорт

```typescript
// Видалити
import { getAdminApiFullPath } from '@/lib/admin-paths';

// Додати
import { adminApi } from '@/lib/adminFetch';
```

---

### Крок 2: GET запити

```typescript
// ❌ Було
const response = await fetch(getAdminApiFullPath('/sessions'), {
  credentials: 'include',
});
if (!response.ok) throw new Error('...');
const data = await response.json();

// ✅ Стало
const data = await adminApi.get('/sessions');
```

```typescript
// ❌ Було
const response = await fetch(getAdminApiFullPath('/stats?days=30'), {
  credentials: 'include',
});
const data = await response.json();

// ✅ Стало
const data = await adminApi.get('/stats?days=30');
```

---

### Крок 3: POST запити

```typescript
// ❌ Було
const csrfToken = document.cookie
  .split('; ')
  .find((row) => row.startsWith('csrf_token='))
  ?.split('=')[1];

const response = await fetch(getAdminApiFullPath('/auth/login'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken || '',
  },
  body: JSON.stringify({ email, password }),
  credentials: 'include',
});

// ✅ Стало
const data = await adminApi.post('/auth/login', { email, password });
```

---

### Крок 4: DELETE запити

```typescript
// ❌ Було
const csrfToken = getCsrfToken();
const response = await fetch(getAdminApiFullPath(`/sessions/${id}`), {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken || '',
  },
  body: JSON.stringify({ twoFAToken }),
  credentials: 'include',
});

// ✅ Стало
await adminApi.delete(`/sessions/${id}`, { twoFAToken });
```

---

### Крок 5: PUT/PATCH запити

```typescript
// ❌ Було
const response = await fetch(getAdminApiFullPath(`/settings/${key}`), {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken || '',
  },
  body: JSON.stringify({ value, description }),
  credentials: 'include',
});

// ✅ Стало
await adminApi.put(`/settings/${key}`, { value, description });
```

---

### Крок 6: Обробка помилок

```typescript
// ❌ Було
try {
  const response = await fetch(...);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Помилка');
  }
  const data = await response.json();
} catch (error: any) {
  toast.error(error.message);
}

// ✅ Стало
try {
  const data = await adminApi.get('/endpoint');
} catch (error: any) {
  toast.error(error.message);
  // 401 вже оброблено автоматично → редірект на login
}
```

---

### Крок 7: Типізація (опціонально)

```typescript
interface SessionsResponse {
  sessions: Session[];
}

// З типізацією
const data = await adminApi.get<SessionsResponse>('/sessions');
// data.sessions — типізовано ✅

// Без типізації
const data = await adminApi.get('/sessions');
// data — any
```

---

## Файли для оновлення (27 місць)

### Пріоритет 1 (критичні):

1. ✅ `client/src/app/admin-x8k2p9-panel/security/page.tsx` — **ГОТОВО**
2. `client/src/app/admin-x8k2p9-panel/login/page.tsx` (2 виклики)
3. `client/src/app/admin-x8k2p9-panel/DashboardView.tsx` (6 викликів)

### Пріоритет 2 (важливі):

4. `client/src/app/admin-x8k2p9-panel/orders/page.tsx`
5. `client/src/app/admin-x8k2p9-panel/products/page.tsx`
6. `client/src/app/admin-x8k2p9-panel/users/page.tsx`
7. `client/src/app/admin-x8k2p9-panel/settings/page.tsx`

### Пріоритет 3 (менш критичні):

8. Інші компоненти та сторінки

---

## Переваги adminApi

✅ **Коротший код** — 3 рядки замість 10+  
✅ **Автоматичний logout** — 401 → редірект на login  
✅ **Автоматичні CSRF токени** — не треба вручну додавати  
✅ **Автоматичні credentials** — не треба писати `credentials: 'include'`  
✅ **Типізація** — TypeScript підказки  
✅ **Обробка помилок** — парсинг JSON помилок  
✅ **Консистентність** — всі запити працюють однаково

---

## Приклад повної міграції файлу

### Було (login/page.tsx):

```typescript
import { getAdminApiFullPath } from '@/lib/admin-paths';

const handleLogin = async () => {
  const csrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
    ?.split('=')[1];

  const response = await fetch(getAdminApiFullPath('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken || '',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  // ...
};
```

### Стало:

```typescript
import { adminApi } from '@/lib/adminFetch';

const handleLogin = async () => {
  const data = await adminApi.post('/auth/login', { email, password });
  // ...
};
```

**Результат:** 20 рядків → 3 рядки ✅

---

## Команда для пошуку всіх місць

```bash
# Знайти всі файли з fetch(getAdminApiFullPath
grep -r "fetch(getAdminApiFullPath" client/src --include="*.tsx" --include="*.ts"

# Порахувати кількість
grep -r "fetch(getAdminApiFullPath" client/src --include="*.tsx" --include="*.ts" | wc -l
```

---

**Автор:** Claude (Kiro)  
**Дата:** 2026-05-01
