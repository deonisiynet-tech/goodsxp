# Root Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy server prisma schema
COPY server/prisma ./prisma

# Generate Prisma Client with temp DATABASE_URL
RUN echo 'DATABASE_URL="postgresql://u:p@localhost:5432/db"' > .env && \
    npx prisma generate && \
    rm -f .env

# Copy all server source code
COPY server/ ./

# Build TypeScript
RUN npm run build

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/server.js"]
