# Admin Authentication Deployment Instructions

## Quick Start

### 1. Update Environment Variables on Railway

Add these to your Railway project:

```env
# JWT Security (REQUIRED - change this!)
JWT_SECRET=your-super-secret-production-key-min-32-characters-long

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=YourSecurePassword123!

# Production Settings
NODE_ENV=production
```

### 2. Deploy

```bash
# Push to main branch
git add .
git commit -m "feat: add admin authentication"
git push origin main

# Railway will auto-deploy
```

### 3. Verify Deployment

1. **Test unauthorized access:**
   - Open incognito window
   - Go to `https://goodsxp.store/admin`
   - Should redirect to `/admin/login`

2. **Test login:**
   - Enter admin credentials
   - Should redirect to admin dashboard

3. **Test protected routes:**
   - Navigate to `/admin/products`
   - Should work without redirect

4. **Test logout:**
   - Click "Вийти" in sidebar
   - Should redirect to login page

## Default Credentials

```
Email: goodsxp.net@gmail.com
Password: Admin123
```

**⚠️ IMPORTANT:** Change these immediately after first login!

## Changing Admin Password

### Option 1: Via Railway Environment Variables

1. Go to Railway Dashboard → Variables
2. Update `ADMIN_PASSWORD`
3. Redeploy (automatic)
4. Server will update admin password on startup

### Option 2: Via Railway PostgreSQL

1. Open Railway Dashboard → PostgreSQL
2. Click "Connect" → "Web CLI"
3. Run:
```sql
-- Generate new hash first (use Node.js)
-- const hash = await require('bcryptjs').hash('NewPassword123!', 12);

UPDATE "User" 
SET password = '<generated-hash>' 
WHERE email = 'goodsxp.net@gmail.com';
```

## Troubleshooting

### Login page shows but login fails

**Check:**
- Database connection is working
- Admin user exists in database
- JWT_SECRET is set

```bash
# Check server logs on Railway
railway logs
```

### Redirect loop

**Solution:** Clear browser cookies
- Open DevTools → Application → Cookies
- Delete `admin_session` cookie
- Refresh page

### Can't access admin after deployment

**Check:**
1. `NODE_ENV=production` is set
2. HTTPS is enabled (Railway does this automatically)
3. Admin user has `role: ADMIN` in database

### Middleware errors

**Solution:** Rebuild client
```bash
cd client
npm run build
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] HTTPS enabled on Railway
- [ ] Admin email updated to your email
- [ ] Reviewed admin access logs regularly

## File Upload Path

After authentication implementation, file uploads continue to work as before:
- Cloudinary: `client/src/app/api/upload/route.ts`
- Server uploads: `/uploads` directory

No changes needed for file uploads.

## API Routes Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/admin/auth/login` | ❌ | Admin login |
| POST | `/api/admin/auth/logout` | ❌ | Admin logout |
| GET | `/api/admin/auth/me` | ❌ | Get current user |
| GET | `/api/admin/*` | ✅ (cookie) | Admin panel routes |

## Monitoring

Check admin activity logs:
- URL: `https://goodsxp.store/admin/logs`
- Shows all admin actions (login, updates, deletes)

## Rollback

If issues occur:
```bash
git revert HEAD
git push origin main
```

Or use Railway Dashboard → Deployments → Previous deployment → Deploy
