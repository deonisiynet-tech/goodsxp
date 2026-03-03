# Server Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy server package files
COPY package*.json ./

# Install server dependencies
RUN npm install

# Build client first
WORKDIR /client
COPY ../client/package*.json ./
RUN npm install
COPY ../client/ ./
RUN npm run build
# Тепер /client/.next існує з CSS файлами

# Return to server
WORKDIR /app

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN echo 'DATABASE_URL="postgresql://u:p@localhost:5432/db"' > .env && \
    npx prisma generate && \
    rm -f .env

# Copy ONLY server source files
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

ENV NODE_ENV=production
ENV CLIENT_DIR=/client
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/server.js"]
