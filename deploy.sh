#!/bin/bash
# Quick Deploy Script for Railway
# This script helps you deploy to Railway quickly

echo "🚀 GoodsXP - Quick Deploy to Railway"
echo "======================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI is not installed."
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"

# Login to Railway
echo ""
echo "🔐 Checking Railway login..."
railway whoami 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Railway"
    echo "Please login with: railway login"
    exit 1
fi
echo "✅ Logged in to Railway"

# Check if project is linked
echo ""
echo "📦 Checking project linkage..."
if [ ! -f ".railway.json" ]; then
    echo "❌ railway.json not found"
    exit 1
fi
echo "✅ railway.json found"

# Build and deploy
echo ""
echo "🔨 Building Docker image..."
docker build -t goodsxp:latest .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker build successful"

echo ""
echo "📤 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check your deployment at:"
echo "https://railway.app"
