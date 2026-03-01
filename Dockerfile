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

# Railway will inject PORT environment variable at runtime
# Server listens on 0.0.0.0:${PORT}

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy --skip-generate && node dist/server.js"]
