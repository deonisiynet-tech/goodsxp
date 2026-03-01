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
ENV PORT=5000

# Railway will inject PORT environment variable at runtime
# Server listens on 0.0.0.0:${PORT}

# Health check for Railway (using wget for Alpine compatibility)
# start-period=120s gives server 2 minutes to fully start before health checks begin
HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Run migrations and start server
# Use --skip-generate because we already generated during build
# Use --skip-seed to avoid duplicate seed errors
CMD ["sh", "-c", "npx prisma migrate deploy --skip-generate && node dist/server.js"]
