# 🚀 Railway Deployment - Final Fix for 504 Error

## ✅ Fixes Applied

### Critical Fix: PORT Environment Variable

**Problem:** Dockerfile was hardcoding `PORT=5000`, which overrode Railway's PORT environment variable.

**Solution:** Removed hardcoded PORT from Dockerfile.

### Changes Made:

#### 1. Dockerfile
```diff
- ENV NODE_ENV=production
- ENV PORT=5000

+ ENV NODE_ENV=production
+ # DO NOT set PORT here - Railway injects it at runtime
+ # PORT will be provided by Railway environment
```

#### 2. Dockerfile Health Check
```diff
- CMD node -e "require('http').get('http://localhost:5000/health', ...)"
+ CMD node -e "const p=process.env.PORT||5000; require('http').get('http://localhost:'+p+'/health', ...)"
```

#### 3. server/src/server.ts
- Added detailed startup logging
- Changed default port from 5000 to 8080
- PORT now reads: `process.env.PORT ? Number(process.env.PORT) : 8080`

#### 4. railway.json
```diff
- "startCommand": "npx prisma db push ... && node dist/server.js"
+ "startCommand": "node dist/server.js"
```

Prisma db push now runs only from Dockerfile CMD.

## 📤 Deploy to Railway

### Step 1: Push Changes to Git
```bash
git add .
git commit -m "fix: Railway 504 error - PORT environment variable"
git push origin main
```

### Step 2: Railway Will Auto-Deploy
Railway will automatically rebuild and redeploy.

### Step 3: Monitor Logs
In Railway dashboard, watch for these log messages:

```
============================================================
🚀 STARTING GOODSXP SERVER
============================================================
🔧 SERVER FILE LOADED
📦 NODE_ENV: production
📦 PORT: <some-port-number>
📦 DATABASE_URL: *** SET ***
============================================================
...
✅ Registering API routes...
...
============================================================
✅ SERVER STARTED SUCCESSFULLY
🚀 Server running on port <some-port-number>
============================================================
```

## ✅ Verification Checklist

After deployment completes:

### 1. Health Check
```bash
curl https://goodsxp.store/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-13T...",
  "uptime": 12.345,
  "port": <port-number>
}
```

### 2. Main Site
```
https://goodsxp.store
```
Should load the homepage without 504 error.

### 3. API Products
```bash
curl https://goodsxp.store/api/products
```
Expected response:
```json
{
  "products": [],
  "pagination": {...}
}
```

### 4. Admin Login
```
https://goodsxp.store/admin/login
```
Should show login page.

## 🔍 Troubleshooting

### Still Getting 504?

1. **Check Railway Logs**
   - Go to Railway dashboard
   - Click on your deployment
   - View "Deploy" logs
   - Look for errors

2. **Common Issues:**

   **DATABASE_URL not set:**
   ```
   ❌ FATAL: DATABASE_URL is not set!
   ```
   **Fix:** Add DATABASE_URL in Railway variables:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

   **Port binding error:**
   ```
   ❌ Port 8080 is already in use!
   ```
   **Fix:** This shouldn't happen. Try restarting deployment.

   **Next.js prepare failed:**
   ```
   ❌ Failed to prepare Next.js:
   ```
   **Fix:** Check if .next directory exists in build logs.

3. **Force Redeploy**
   ```bash
   # Make a small change to trigger rebuild
   echo "# Redeploy" >> README.md
   git add .
   git commit -m "chore: force redeploy"
   git push
   ```

## 📊 Expected Railway Logs

```
[Build] Building from Dockerfile...
[Build] Docker build successful
[Deploy] Deploying...
[Deploy] Starting container...
[Deploy] 
[Deploy] ============================================================
[Deploy] 🚀 STARTING GOODSXP SERVER
[Deploy] ============================================================
[Deploy] 📦 NODE_ENV: production
[Deploy] 📦 PORT: 10234
[Deploy] 📦 DATABASE_URL: *** SET ***
[Deploy] ============================================================
[Deploy] ...
[Deploy] ✅ SERVER STARTED SUCCESSFULLY
[Deploy] 🚀 Server running on port 10234
[Deploy] ============================================================
[Deploy] 
[Deploy] Health check passed
[Deploy] Application ready on https://goodsxp.store
```

## 🎯 Why This Works

1. **Railway PORT**: Railway assigns a random port (10000-20000) at runtime via PORT env var
2. **No Hardcoding**: Dockerfile no longer overrides PORT
3. **Proper Binding**: Server binds to `0.0.0.0:PORT` making it accessible
4. **Health Check**: Uses correct PORT for health checks

## 📝 Environment Variables in Railway

Ensure these are set in Railway dashboard → Variables:

```bash
# Required - Railway auto-injects:
DATABASE_URL=${{Postgres.DATABASE_URL}}
RAILWAY_PUBLIC_DOMAIN=${{RAILWAY_PUBLIC_DOMAIN}}

# Add manually:
NODE_ENV=production
JWT_SECRET=your-jwt-secret-min-32-chars
CLIENT_URL=${{RAILWAY_PUBLIC_DOMAIN}}
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ADMIN_EMAIL=goodsxp.net@gmail.com
ADMIN_PASSWORD=Admin123
```

## ✅ Success Indicators

- ✅ Health check returns 200
- ✅ No 504 errors
- ✅ Site loads normally
- ✅ API endpoints respond
- ✅ Admin panel accessible
- ✅ Railway shows "Application ready"
