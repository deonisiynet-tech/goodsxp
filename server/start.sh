#!/bin/bash

# Railway startup script
# Run migrations then start server

set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "✅ Migrations complete"
echo "🚀 Starting server..."

exec node dist/server.js
