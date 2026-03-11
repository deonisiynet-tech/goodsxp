# Root Dockerfile for Railway - Fullstack Build
# Next.js 14 + Express API Server + Cloudinary Support
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

# Install ALL dependencies
RUN npm install

# Copy server source files
COPY server/tsconfig.json ./
COPY server/src ./src

# Copy Prisma schema
COPY server/prisma ./prisma

# Generate Prisma Client
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate --schema=./prisma/schema.prisma

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

# Create public directory
RUN mkdir -p /client/public

# Copy all client source files
COPY client/ .

# Copy Prisma schema for Server Actions
COPY server/prisma ./prisma

# Generate Prisma Client
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build Next.js (creates .next/standalone)
RUN npm run build

# Verify build
RUN ls -la /client/.next/standalone && echo "✅ .next/standalone exists"

# ==================================
# PRODUCTION IMAGE - Express + Next.js
# ==================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy server build (Express API + Next.js handler)
COPY --from=server-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=server-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=server-builder --chown=nodejs:nodejs /app/package.json ./

# Copy Next.js standalone build to client directory
# Express server will load Next.js from here
RUN mkdir -p ./client
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/standalone ./client
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/static ./client/.next/static

# Copy client public directory (for uploads and static assets)
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./client/public

# Create uploads directory at root level
RUN mkdir -p ./uploads && chown nodejs:nodejs ./uploads

# Set correct permissions
USER nodejs

EXPOSE 5000

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Express server which handles both API routes and Next.js pages
CMD ["node", "dist/server.js"]
