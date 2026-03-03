# Root Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy and install server dependencies
COPY server/package*.json ./
RUN npm install

# Build client (Next.js) - Копіюємо ВЕСЬ client перед збіркою
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# Тепер всі файли client (src, app, pages, etc.) доступні
RUN npm run build
# Перевірка: .next має існувати
RUN ls -la /client/.next && echo "✅ .next directory exists at /client/.next"

# Return to server directory
WORKDIR /app

# Copy prisma schema
COPY server/prisma ./prisma

# Generate Prisma Client
RUN echo 'DATABASE_URL="postgresql://u:p@localhost:5432/db"' > .env && \
    npx prisma generate && \
    rm -f .env

# Copy server source files
COPY server/tsconfig.json ./
COPY server/src ./src

# Build TypeScript server
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV CLIENT_DIR=/client
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the custom Express server with Next.js
CMD ["npm", "run", "start"]
