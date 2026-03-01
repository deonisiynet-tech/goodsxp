FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

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

# Simple health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/server.js"]
