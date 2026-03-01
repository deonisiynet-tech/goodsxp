FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma and wget for health checks
RUN apk add --no-cache openssl wget

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

ENV NODE_ENV=production
EXPOSE 5000

# Health check for Railway (using wget for Alpine compatibility)
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Run migrations and start server (seed is optional, can be run manually)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
