# CSRF Token Fix for Promo Code Creation

**Date:** 2026-04-18
**Issue:** 403 Forbidden - CSRF token validation failed

---

## Problem

When creating or editing promo codes in the admin panel, the request failed with:
```
POST /api/admin-x8k2p9-panel/promo-codes 403 (Forbidden)
Error: CSRF token validation failed
```

---

## Root Cause

The `PromoCodeModal.tsx` component was not including the CSRF token in the request headers when making POST/PUT requests to create or update promo codes.

The admin routes are protected by CSRF middleware (configured in `server/src/server.ts` line 342):
```typescript
app.use(`${adminApiPrefix}`, csrfProtection);
```

---

## Solution

Added CSRF token extraction from cookies and included it in the request headers:

```typescript
// Get CSRF token from cookies
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf_token='))
  ?.split('=')[1];

const response = await fetch(url, {
  method: promoCode ? 'PUT' : 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken || '',  // ← Added CSRF token
  },
  credentials: 'include',
  body: JSON.stringify(data),
});
```

---

## File Changed

- `client/src/components/admin/PromoCodeModal.tsx` (lines 109-119)

---

## Testing

After this fix:
- ✅ Creating new promo codes works
- ✅ Editing existing promo codes works
- ✅ CSRF protection remains active
- ✅ No 403 errors

---

## Related Pattern

This same pattern is used in other admin components:
- `OrderModal.tsx` - includes CSRF token for order deletion
- Other admin CRUD operations that modify data

---

**Fix applied successfully!**
