# MARGIN BUG - DEBUG GUIDE

## Problem
Product margin resets to 0 after save, even though response says "success".

## Debug Logs Added

I've added comprehensive logging at every step of the data flow:

### 1. Frontend - ProductModal (client/src/components/admin/ProductModal.tsx)
```
🔍 MODAL UPDATE - Form data.margin
```
- Shows what the form is sending
- Shows the original product.margin value

### 2. Frontend - API Client (client/src/lib/products-api.ts)
```
🔍 API UPDATE - Received data.margin
🔍 API UPDATE - Sending margin
```
- Shows margin before FormData conversion
- Shows margin after validation (line 428 logic)

### 3. Backend - Controller (server/src/controllers/product.controller.ts)
```
🔍 UPDATE PRODUCT - Received margin
🔍 UPDATE PRODUCT - After conversion
```
- Shows what req.body.margin contains
- Shows margin after Number() conversion

### 4. Backend - Service (server/src/services/product.service.ts)
```
🔍 SERVICE UPDATE - Data to save
🔍 SERVICE UPDATE - Saved to DB
```
- Shows what's being sent to Prisma
- Shows what was actually saved in the database

## How to Test

1. **Start the server with logs visible:**
   ```bash
   cd C:\Users\User\Desktop\shop-mvp\server
   npm run dev
   ```

2. **Start the client:**
   ```bash
   cd C:\Users\User\Desktop\shop-mvp\client
   npm run dev
   ```

3. **Open browser console** (F12)

4. **Test scenario:**
   - Go to admin panel → Products
   - Click Edit on any product
   - Set margin to **1000**
   - Click Save
   - Watch BOTH server logs AND browser console

5. **Expected log sequence:**
   ```
   Browser Console:
   🔍 MODAL UPDATE - Form data.margin: { margin: 1000, type: "number", ... }
   🔍 API UPDATE - Received data.margin: { margin: 1000, type: "number", ... }
   🔍 API UPDATE - Sending margin: { marginValue: 1000, asString: "1000" }

   Server Console:
   🔍 UPDATE PRODUCT - Received margin: { margin: "1000", type: "string", ... }
   🔍 UPDATE PRODUCT - After conversion: { marginInUpdateData: 1000, isNaN: false }
   🔍 SERVICE UPDATE - Data to save: { margin: 1000, hasMargin: true, ... }
   🔍 SERVICE UPDATE - Saved to DB: { id: "...", margin: 1000, ... }
   ```

## Suspected Issues

### Issue #1: Form sends string instead of number
**Location:** ProductModal form
**Symptom:** `data.margin` is string "1000" instead of number 1000
**Fix:** Add `valueAsNumber` to form field

### Issue #2: API client converts undefined to 0
**Location:** `client/src/lib/products-api.ts` line 428
```typescript
const marginValue = typeof data.margin === 'number' && !isNaN(data.margin) ? data.margin : 0
```
**Problem:** If `data.margin` is undefined, it defaults to 0
**Fix:** Don't send margin if undefined

### Issue #3: FormData converts number to string incorrectly
**Location:** `client/src/lib/products-api.ts` line 429
**Symptom:** Empty string "" sent instead of "1000"
**Fix:** Validate before converting to string

### Issue #4: Backend receives empty string
**Location:** `server/src/controllers/product.controller.ts` line 468
```typescript
if (margin !== undefined) updateData.margin = Number(margin);
```
**Problem:** `Number("")` = 0
**Fix:** Check for empty string before Number()

## Next Steps

1. Run the test scenario above
2. Check the logs to find WHERE margin becomes 0
3. Apply the appropriate fix based on which log shows the problem
4. Remove all debug logs after fix is confirmed

## Database Verification

After saving, verify in database:
```sql
SELECT id, title, margin FROM "Product" WHERE id = 'your-product-id';
```

If margin is 0 in DB but logs show 1000 was sent, there's a Prisma issue.
If margin is 1000 in DB but API returns 0, there's a response transformation issue.
