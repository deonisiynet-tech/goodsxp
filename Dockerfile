# Root Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy and install server dependencies
COPY server/package*.json ./
RUN npm install

# Build client (Next.js)
WORKDIR /client

# 1. Copy client package files
COPY client/package*.json ./

# 2. Install client dependencies (includes @prisma/client)
RUN npm install

# 3. Copy Prisma schema from server
COPY server/prisma ./prisma

# 4. Generate Prisma Client in /client/node_modules
#    @prisma/client уже установлен в /client/node_modules
#    schema.prisma доступна в /client/prisma
#    generate создаст /client/node_modules/.prisma
RUN npx prisma generate

# 5. Copy rest of client source code
COPY client .

# 6. Build Next.js (Prisma Client вже існує в node_modules)
RUN npm run build

# Verify .next exists
RUN ls -la /client/.next && echo "✅ .next directory exists at /client/.next"

# Return to server directory
WORKDIR /app

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
