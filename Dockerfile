FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma and bash for diagnostics
RUN apk add --no-cache openssl bash

# Copy server files
COPY server/package*.json ./
COPY server/prisma ./prisma
COPY server/ ./

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN echo 'DATABASE_URL="postgresql://u:p@localhost:5432/db"' > .env && \
    npx prisma generate && \
    rm -f .env

# Build
RUN npm run build

# DIAGNOSTIC: Check dist folder exists
RUN ls -la && ls -la dist

ENV NODE_ENV=production

# Railway will inject PORT environment variable at runtime
# Server listens on 0.0.0.0:${PORT}

# Run migrations, check files, and start server with diagnostics
CMD ["sh", "-c", "echo '=== DIAGNOSTIC START ===' && ls -la && ls -la dist && echo '=== Starting server ===' && npx prisma migrate deploy && node dist/server.js"]
