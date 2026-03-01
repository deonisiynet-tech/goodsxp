# Railway Dockerfile for GoodsXP Backend
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files from server directory
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY server/prisma ./prisma

# Generate Prisma Client (with temp DATABASE_URL for build)
RUN echo 'DATABASE_URL="postgresql://u:p@localhost:5432/db"' > .env && \
    npx prisma generate && \
    rm -f .env

# Copy all server source code
COPY server/ ./

# Build TypeScript
RUN npm run build

# Production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Health check for Railway - увеличенный start-period
HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command: migrate, seed, start
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/server.js"]
