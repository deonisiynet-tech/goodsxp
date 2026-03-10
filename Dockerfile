# Root Dockerfile for Railway - Fullstack Build
FROM node:20-alpine AS base

# Install dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# ==================================
# SERVER BUILD
# ==================================
FROM base AS server-builder

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm install

# Copy server source files
COPY server/tsconfig.json ./
COPY server/src ./src

# Copy Prisma schema
COPY server/prisma ./prisma

# Generate Prisma Client
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

# Build TypeScript server
RUN npm run build

# ==================================
# CLIENT BUILD
# ==================================
FROM base AS client-builder

WORKDIR /client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm install

# Copy all client source files
COPY client/ .

# Copy Prisma schema for Server Actions
COPY server/prisma ./prisma

# Generate Prisma Client for Server Actions
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

# Build Next.js (creates .next/standalone)
RUN npm run build

# Verify .next/standalone exists
RUN ls -la /client/.next/standalone && echo "✅ .next/standalone exists"

# ==================================
# PRODUCTION IMAGE
# ==================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV CLIENT_DIR=client

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built server
COPY --from=server-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=server-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=server-builder --chown=nodejs:nodejs /app/package.json ./

# Copy built client (standalone output)
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/standalone ./client
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/static ./client/.next/static
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./client/public

# Set correct permissions
USER nodejs

EXPOSE 5000

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the Express server with Next.js
CMD ["node", "dist/server.js"]
