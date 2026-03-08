# Root Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy and install server dependencies
COPY server/package*.json ./
RUN npm install

# Copy server source files
COPY server/tsconfig.json ./
COPY server/src ./src

# Copy Prisma schema and generate Prisma Client BEFORE building server
COPY server/prisma ./prisma

# Generate Prisma Client (server dependencies include @prisma/client)
# Prisma generate requires DATABASE_URL for schema parsing but doesn't connect to DB
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

# Build TypeScript server (Prisma Client now available)
RUN npm run build

# Build client (Next.js)
WORKDIR /client

# 1. Copy client package files
COPY client/package*.json ./

# 2. Install client dependencies (includes @prisma/client)
RUN npm install

# 3. Copy Prisma schema from server (already copied, but ensure it's available)
COPY server/prisma ./prisma

# 4. Generate Prisma Client in /client/node_modules
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

# 5. Copy rest of client source code
COPY client .

# 6. Build Next.js (Prisma Client вже згенеровано)
RUN npm run build

# Verify .next exists
RUN ls -la /client/.next && echo "✅ .next directory exists at /client/.next"

# Return to server directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV CLIENT_DIR=/client
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the custom Express server with Next.js
# Note: Database migrations should be run separately via Railway CLI or dashboard
CMD ["npm", "run", "start"]
