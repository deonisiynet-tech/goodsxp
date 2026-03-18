#!/bin/bash

# Railway startup script
# Run migrations then start server

set -e

echo "🔄 Running Prisma migrations..."
node dist/prisma/migrate.js

echo "✅ Migrations complete"
echo "🚀 Starting server..."

exec node dist/server.js
