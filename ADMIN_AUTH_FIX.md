# 🛠️ Admin Authentication Fix

## Проблема

1. Сайт працює
2. API `/api/products` працює
3. `/api/admin/*` вимагає авторизацію
4. При вході в `/admin` - **нескінченна загрузка**
5. Статистика не завантажується
6. API повертає `"Потрібна авторизація"`

## Причина

**Middleware `authenticate` перевіряв тільки `Authorization: Bearer` токен, але не cookie `admin_session`.**

Admin login встановлює cookie, але middleware її не читав.

## Виправлення

### 1️⃣ server/src/middleware/auth.ts

**Додано підтримку cookie:**

```typescript
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // First check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('🔑 Auth: Found Bearer token');
  }

  // If no Bearer token, check cookies (for admin session)
  if (!token && req.cookies) {
    token = req.cookies.admin_session;
    if (token) {
      console.log('🔑 Auth: Found admin_session cookie');
    }
  }

  // No token found
  if (!token) {
    console.log('⚠️ Auth: No token found');
    return res.status(401).json({ error: 'Потрібна авторизація' });
  }

  // ... verify token
};
```

### 2️⃣ server/src/server.ts

**Покращено CORS logging:**

```typescript
app.use(cors({
  origin: (origin, callback) => {
    console.log('🔒 CORS check:', origin);
    
    if (!origin) {
      console.log('✅ CORS: No origin (mobile/curl)');
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed:', origin);
      return callback(null, true);
    }
    
    // Allow railway.app and goodsxp.store domains
    if (origin.includes('railway.app') || origin.includes('goodsxp.store')) {
      console.log('✅ CORS: Railway domain allowed:', origin);
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // IMPORTANT: Allow cookies
}));
```

### 3️⃣ client/src/app/admin/DashboardView.tsx

**Додано `credentials: 'include'` та logging:**

```typescript
useEffect(() => {
  console.log('🔍 Dashboard: Checking authentication...');
  
  fetch('/api/admin/auth/me', { 
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  })
    .then((res) => {
      console.log('🔍 Dashboard: Auth response status:', res.status);
      
      if (res.status === 401) {
        console.log('⚠️ Dashboard: Not authenticated, redirecting to login');
        router.push('/admin/login?from=/admin')
        throw new Error('Not authenticated')
      }
      return res.json()
    })
    .then((auth) => {
      console.log('🔍 Dashboard: Auth response:', auth);
      
      if (!auth.authenticated) {
        router.push('/admin/login?from=/admin')
        throw new Error('Not authenticated')
      }
      
      console.log('✅ Dashboard: Authenticated, fetching stats...');
      
      // MUST include credentials for cookie
      return fetch('/api/admin/stats', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      })
    })
    // ...
}, [])
```

## 📁 Виправлені файли

| Файл | Зміни |
|------|-------|
| `server/src/middleware/auth.ts` | Додано підтримку cookie `admin_session` |
| `server/src/server.ts` | Покращено CORS logging |
| `client/src/app/admin/DashboardView.tsx` | Додано `credentials: 'include'` та debug logging |

## ✅ Перевірка

### 1. Login page відкривається
```
https://goodsxp.store/admin/login
```

### 2. Login встановлює cookie
Після успішного входу перевірте DevTools → Application → Cookies:
- Name: `admin_session`
- Path: `/`
- Secure: `true` (в production)

### 3. Cookie відправляється на API
В DevTools → Network:
- Запит до `/api/admin/stats`
- Request Headers: `Cookie: admin_session=...`

### 4. API повертає дані
```json
{
  "totalUsers": 5,
  "totalOrders": 10,
  "totalRevenue": 5000,
  ...
}
```

### 5. Dashboard завантажується
Ніякої нескінченної загрузкі.

## 🔍 Debug Logging

### Server logs (Railway):
```
🔒 CORS allowed origins: [...]
🔒 CORS check: https://goodsxp.store
✅ CORS: Railway domain allowed: https://goodsxp.store
...
🔑 Auth: Found admin_session cookie
✅ Auth: User authenticated: admin@example.com ADMIN
```

### Browser console:
```
🔍 Dashboard: Checking authentication...
🔍 Dashboard: Auth response status: 200
🔍 Dashboard: Auth response: { authenticated: true, user: {...} }
✅ Dashboard: Authenticated, fetching stats...
📊 Dashboard: Stats response status: 200
✅ Dashboard: Stats loaded: {...}
```

## 🚀 Deploy

```bash
git add .
git commit -m "fix: admin authentication - cookie support"
git push origin main
```

Railway автоматично перебудує і запустить.

## 🎯 Expected Flow

1. User → `/admin/login` → Login page loads
2. User enters credentials → POST `/api/admin/auth/login`
3. Server validates → Sets `admin_session` cookie
4. Redirect to `/admin`
5. Dashboard fetches `/api/admin/auth/me` with `credentials: 'include'`
6. Server reads cookie → Returns authenticated user
7. Dashboard fetches `/api/admin/stats` with `credentials: 'include'`
8. Server reads cookie → Returns stats
9. Dashboard displays data ✅
