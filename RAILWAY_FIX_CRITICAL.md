# 🔧 CRITICAL FIX: Railway Deployment

## Problem
Admin page shows "Internal Server Error" because Server Actions cannot connect to the database.

## Root Cause
1. `DATABASE_URL` environment variable may not be set correctly in Railway
2. Database migrations may not have been run
3. Prisma Client cannot connect to PostgreSQL

## Solution Steps

### Step 1: Set Environment Variables on Railway

Go to your Railway project → Variables tab and add:

```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```

**Important:** Replace with your actual Railway PostgreSQL connection string!

You can find it in Railway:
1. Go to your PostgreSQL service
2. Click "Connect" → "Copy Connection String"
3. Paste it in Variables as `DATABASE_URL`

### Step 2: Run Database Migrations

After setting `DATABASE_URL`, you need to run Prisma migrations:

**Option A: Using Railway CLI**
```bash
railway run npx prisma migrate deploy
```

**Option B: Add to Railway Deploy Command**

In Railway dashboard → Settings → Deploy Command:
```bash
cd server && npx prisma migrate deploy && npx prisma db push && cd .. && npm run build
```

**Option C: Using Dockerfile (Recommended)**

The Dockerfile already includes `prisma generate`, but we need to add migration step.

### Step 3: Verify Database Connection

After deployment, check Railway logs:
1. Go to Railway dashboard
2. Click on your service
3. Open "Deployments" → View logs
4. Look for "✅ SERVER STARTED" message

### Step 4: Test Admin Page

Visit: `https://goodsxp-production.up.railway.app/admin`

If you see the dashboard (even with 0 data), the connection is working!

## Default Admin Credentials

After successful deployment, login with:
- **Email:** `goodsxp.net@gmail.com`
- **Password:** `Admin123` (or the one you set in `ADMIN_PASSWORD`)

## Troubleshooting

### Error: "Can't reach database server"
- Check `DATABASE_URL` is correct
- Verify PostgreSQL service is running in Railway
- Check firewall/network settings

### Error: "Database does not exist"
- Run migrations: `npx prisma migrate deploy`
- Or reset database: `npx prisma db push --accept-data-loss`

### Error: "Table does not exist"
- Run: `npx prisma db push`
- This will create all tables from schema

### Admin page still shows error
1. Check Railway logs for error messages
2. Verify `DATABASE_URL` is set
3. Try redeploying: `git push` or manual redeploy in Railway

## Quick Fix Commands

```bash
# Connect to Railway
railway login

# Set DATABASE_URL
railway variables set DATABASE_URL="your-connection-string"

# Run migrations
railway run npx prisma migrate deploy

# Redeploy
railway up
```

## Verify Everything Works

1. ✅ Homepage loads: `/`
2. ✅ Catalog loads: `/catalog`
3. ✅ Admin page loads: `/admin` (may show 0 data initially)
4. ✅ Can login to admin: `/login`
5. ✅ API health check: `/health`
