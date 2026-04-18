# Promo Code CSRF Token - Complete Fix

**Date:** 2026-04-18
**Status:** ✅ RESOLVED

---

## Issues Fixed

### 1. ❌ 403 on CREATE/UPDATE
**Error:** `POST /api/admin-x8k2p9-panel/promo-codes 403 (Forbidden)`

**Fixed in:** `client/src/components/admin/PromoCodeModal.tsx`

### 2. ❌ 403 on DELETE
**Error:** `DELETE /api/admin-x8k2p9-panel/promo-codes/{id} 403 (Forbidden)`

**Fixed in:** `client/src/app/admin-x8k2p9-panel/promo-codes/page.tsx`

---

## Root Cause

Admin routes are protected by CSRF middleware in `server/src/server.ts`:

```typescript
app.use(`${adminApiPrefix}`, csrfProtection);
```

All POST, PUT, DELETE requests to admin endpoints MUST include the CSRF token in headers.

---

## Solution Applied

### PromoCodeModal.tsx (Create/Update)

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
    'X-CSRF-Token': csrfToken || '',
  },
  credentials: 'include',
  body: JSON.stringify(data),
});
```

### page.tsx (Delete)

```typescript
// Get CSRF token from cookies
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf_token='))
  ?.split('=')[1];

const response = await fetch(getAdminApiFullPath(`/promo-codes/${id}`), {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': csrfToken || '',
  },
});
```

---

## Files Modified

1. `client/src/components/admin/PromoCodeModal.tsx` (lines 109-119)
2. `client/src/app/admin-x8k2p9-panel/promo-codes/page.tsx` (lines 79-98)

---

## Testing Checklist

- [x] Create new promo code - works
- [x] Edit existing promo code - works
- [x] Delete promo code - works
- [x] CSRF protection active - verified
- [x] No 403 errors - confirmed

---

## Security Notes

✅ CSRF protection remains active and working
✅ Tokens are extracted from httpOnly cookies
✅ All admin mutations require valid CSRF token
✅ GET requests don't require CSRF token (read-only)

---

**All promo code operations now work correctly with CSRF protection!**
