# Admin Authentication Guide

## Overview

Secure admin authentication has been implemented for the `/admin` routes using:
- **bcryptjs** for password hashing
- **JWT tokens** stored in **httpOnly cookies**
- **Next.js Middleware** for route protection

## Features

### 🔐 Security Features
- ✅ httpOnly cookies (not accessible via JavaScript)
- ✅ Secure cookies in production (HTTPS only)
- ✅ sameSite: lax protection
- ✅ Role-based access (ADMIN role required)
- ✅ Automatic redirect to login for unauthorized access

### 🛡️ Protected Routes
- `/admin`
- `/admin/products`
- `/admin/orders`
- `/admin/users`
- `/admin/settings`
- `/admin/logs`

## Default Admin Credentials

```
Email: goodsxp.net@gmail.com
Password: Admin123
```

**⚠️ IMPORTANT:** Change these credentials in production!

## API Endpoints

### POST `/api/admin/auth/login`

Admin login endpoint.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**Response (Error):**
```json
{
  "error": "Невірний email або пароль"
}
```

**Cookie Set:**
- Name: `admin_session`
- Value: JWT token
- httpOnly: true
- secure: true (production) / false (development)
- sameSite: lax
- maxAge: 7 days

---

### POST `/api/admin/auth/logout`

Clear admin session cookie.

**Response:**
```json
{
  "success": true
}
```

---

### GET `/api/admin/auth/me`

Get current admin user status.

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

## Login Page

**URL:** `/admin/login`

Features:
- Clean, minimal UI
- Email and password inputs
- Form validation
- Success/error feedback
- Auto-redirect if already authenticated
- Redirect back to original URL after login

## Middleware

Location: `client/src/middleware.ts`

The middleware:
1. Checks for `admin_session` cookie
2. Redirects unauthenticated users to `/admin/login`
3. Redirects authenticated users away from `/admin/login`
4. Preserves the original URL for post-login redirect

## Logout

The logout button is located in the `AdminLayout` sidebar:
- Click "Вийти" button
- Confirms logout action
- Clears session cookie via API call
- Redirects to `/admin/login`

## Changing Admin Password

### Option 1: Update Environment Variables

1. Edit `server/.env`:
```env
ADMIN_PASSWORD=YourNewSecurePassword123!
```

2. Restart the server - admin password will be updated automatically

### Option 2: Direct Database Update

```sql
UPDATE "User" 
SET password = '<hashed-password>' 
WHERE email = 'goodsxp.net@gmail.com';
```

Generate hash:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('YourNewPassword', 12);
```

## Production Deployment (Railway)

### Environment Variables

Set these in Railway dashboard:

```env
# JWT
JWT_SECRET=your-super-secret-production-key-min-32-characters

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=YourSecurePassword123!

# Node Environment
NODE_ENV=production
```

### Cookie Security in Production

In production (`NODE_ENV=production`):
- Cookies are marked as `secure: true` (HTTPS only)
- Ensure your Railway deployment uses HTTPS

## Testing

### Test 1: Unauthorized Access
1. Open incognito/private window
2. Navigate to `https://goodsxp.store/admin`
3. Should redirect to `/admin/login`

### Test 2: Login
1. Enter credentials
2. Click "Увійти"
3. Should redirect to `/admin`

### Test 3: Protected Routes
1. After login, try accessing `/admin/products`
2. Should work without redirect

### Test 4: Logout
1. Click "Вийти" button
2. Confirm
3. Should redirect to `/admin/login`
4. Try accessing `/admin` - should redirect to login

### Test 5: Direct URL Access
1. Logout
2. Try navigating directly to `/admin/orders`
3. Should redirect to login page

## File Structure

```
shop-mvp/
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx          # NEW: Login page
│   │   │   │   └── ...
│   │   │   └── middleware.ts              # NEW: Route protection
│   │   └── components/
│   │       └── admin/
│   │           └── AdminLayout.tsx        # MODIFIED: Added logout
│   └── .env.local.example                 # MODIFIED
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── admin.auth.routes.ts       # NEW: Auth API routes
│   │   └── server.ts                      # MODIFIED: Added cookie-parser
│   └── .env.example                       # MODIFIED
└── ADMIN_AUTH_GUIDE.md                    # NEW: This file
```

## Modified/Created Files Summary

### Created Files:
1. `server/src/routes/admin.auth.routes.ts` - Admin auth API endpoints
2. `client/src/middleware.ts` - Next.js middleware for route protection
3. `client/src/app/admin/login/page.tsx` - Admin login page
4. `ADMIN_AUTH_GUIDE.md` - This documentation

### Modified Files:
1. `server/src/server.ts` - Added cookie-parser and admin auth routes
2. `client/src/components/admin/AdminLayout.tsx` - Added logout functionality
3. `client/.env.local.example` - Added session secret documentation
4. `server/.env.example` - Added session cookie documentation

### Dependencies Added:
1. `jose` (client) - JWT handling in middleware
2. `cookie-parser` (server) - Cookie parsing
3. `@types/cookie-parser` (server/dev) - TypeScript types

## Troubleshooting

### Issue: Login redirects but session not persisted

**Solution:** Check that cookies are being set correctly
- Verify `credentials: 'include'` in fetch calls
- Check CORS settings allow credentials

### Issue: Middleware redirects in production

**Solution:** Ensure HTTPS is enabled
- Railway provides HTTPS by default
- Check `NODE_ENV=production` is set

### Issue: Can't access admin after login

**Solution:** Verify admin role in database
```sql
SELECT email, role FROM "User" WHERE email = 'your@email.com';
```

Should return `role: ADMIN`

### Issue: 401 on /api/admin/auth/me

**Solution:** Check JWT_SECRET matches between login and verification
- Same secret must be used for signing and verifying

## Additional Security Recommendations

1. **Rate Limiting**: Add rate limiting to `/api/admin/auth/login`
2. **2FA**: Consider implementing two-factor authentication
3. **Session Expiry**: Reduce JWT expiration time for sensitive operations
4. **IP Whitelisting**: Restrict admin access to specific IPs
5. **Audit Logs**: Review `/admin/logs` regularly
6. **Password Policy**: Enforce strong password requirements

## Support

For issues or questions, refer to the main project documentation or contact the development team.
