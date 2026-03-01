#!/bin/bash

# ==================================
# Railway Deployment Recovery Script
# ==================================

echo "🚀 Railway Deployment Recovery"
echo "=============================="
echo ""

# Step 1: Check Git status
echo "📦 Step 1: Checking Git status..."
git status
git pull origin main
echo ""

# Step 2: Clean build caches
echo "🧹 Step 2: Cleaning local caches..."
rm -rf server/node_modules server/dist server/.prisma
rm -rf client/node_modules client/.next
rm -rf node_modules
echo "✅ Caches cleaned"
echo ""

# Step 3: Reinstall dependencies
echo "📦 Step 3: Reinstalling dependencies..."
cd server && npm install && cd ..
echo "✅ Dependencies installed"
echo ""

# Step 4: Generate Prisma Client
echo "🔧 Step 4: Generating Prisma Client..."
cd server && npx prisma generate && cd ..
echo "✅ Prisma Client generated"
echo ""

# Step 5: Build server
echo "🏗️ Step 5: Building server..."
cd server && npm run build && cd ..
echo "✅ Server built"
echo ""

# Step 6: Test health endpoint locally
echo "🧪 Step 6: Testing health endpoint..."
echo "Run: curl http://localhost:5000/health"
echo ""

# Step 7: Commit and push
echo "📤 Step 7: Committing changes..."
git add .
git commit -m "fix: deployment recovery"
git push origin main
echo ""

echo "✅ Recovery complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Railway Dashboard"
echo "2. Click 'Deploy' → 'Restart Deployment'"
echo "3. Watch Deploy Logs"
echo "4. Check: https://your-app.railway.app/health"
