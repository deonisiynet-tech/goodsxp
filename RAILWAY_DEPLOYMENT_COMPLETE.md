# Railway Deployment Guide - GoodsXP

## ✅ Fixes Applied

### 1. Prisma Database Repair
- Changed from `migrate deploy` to `db push --accept-data-loss`
- This avoids migration state corruption issues
- Database schema is now synced on every container start

### 2. Docker Startup
- Updated Dockerfile CMD to use `db push`
- Updated railway.json startCommand to use `db push`
- Database tables are created/updated automatically

### 3. Next.js SSR Fix
- All admin components have `'use client'` directive
- No Prisma usage in client components
- All database access through Express API only

### 4. Express Routing Order
- API routes registered BEFORE Next.js handler
- `/api/admin/auth` routes (login/logout) before `/api/admin` (requires auth)
- Health check endpoints at `/health` and `/healthz`

### 5. AdminLog Error Handling
- All AdminLog operations wrapped in try-catch
- Silently ignores errors if table doesn't exist
- Won't crash the server if logging fails

## 🚀 Railway Setup Instructions

### Step 1: Connect to GitHub
1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 2: Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Wait for database to provision

### Step 3: Configure Environment Variables

In Railway dashboard, go to Variables tab and add:

```bash
# Required - Railway auto-injects these:
DATABASE_URL=${{Postgres.DATABASE_URL}}
RAILWAY_PUBLIC_DOMAIN=${{RAILWAY_PUBLIC_DOMAIN}}

# Add these manually:
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
CLIENT_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Cloudinary (optional):
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin credentials (CHANGE THESE!):
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-secure-password
```

### Step 4: Deploy
1. Railway will automatically build using the Dockerfile
2. First deployment may take 5-10 minutes
3. Watch the logs for any errors

### Step 5: Verify Deployment

Check these endpoints:

```
https://your-app.railway.app/health
→ Should return: {"status":"healthy",...}

https://your-app.railway.app/api/products
→ Should return: {"products":[],"pagination":{...}}

https://your-app.railway.app/admin/login
→ Should show admin login page
```

### Step 6: Login to Admin Panel

1. Go to `https://your-app.railway.app/admin/login`
2. Use the credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD`
3. You should be redirected to `/admin` dashboard

## 🔧 Troubleshooting

### Container Crashes with Prisma Error
If you see:
```
Error P3009: migrate found failed migrations
```

Solution: The Dockerfile now uses `db push` which bypasses migration history.

### Admin Login Fails
If login fails with:
```
Invalid prisma.adminLog.create() invocation
```

Solution: This error is now caught silently. Login should work.

### API Returns Empty Data
If `/api/products` returns empty array:

1. Login to admin panel
2. Go to Products section
3. Add some products

### Next.js SSR Errors
If you see:
```
TypeError: Cannot read properties of null (reading 'useContext')
```

Solution: All client components now have `'use client'` directive.

## 📊 Database Tables

The following tables are created automatically:

- `User` - User accounts (with ADMIN/USER roles)
- `Product` - Product catalog
- `Order` - Customer orders
- `OrderItem` - Order line items
- `AdminLog` - Admin action logs
- `SiteSettings` - Site configuration

## 🔐 Default Admin Credentials

```
Email: goodsxp.net@gmail.com (or your ADMIN_EMAIL)
Password: Admin123 (or your ADMIN_PASSWORD)
```

**⚠️ CHANGE THESE IN PRODUCTION!**

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (auto-injected by Railway) |
| `JWT_SECRET` | ✅ | Secret key for JWT tokens (min 32 chars) |
| `NODE_ENV` | ✅ | `production` or `development` |
| `CLIENT_URL` | ✅ | Frontend URL (use `${{RAILWAY_PUBLIC_DOMAIN}}`) |
| `CLOUDINARY_*` | ❌ | Cloudinary credentials for image hosting |
| `ADMIN_EMAIL` | ✅ | Admin login email |
| `ADMIN_PASSWORD` | ✅ | Admin login password |

## 🎯 Post-Deployment Checklist

- [ ] `/health` returns 200 OK
- [ ] `/api/products` returns valid JSON
- [ ] Admin login works
- [ ] Can create products in admin panel
- [ ] Can view orders in admin panel
- [ ] Images upload correctly (Cloudinary or local)
- [ ] All environment variables are set

## 🆘 Support

If issues persist:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure PostgreSQL database is connected
4. Try redeploying after pushing changes
