# Root Dockerfile for Railway - Fullstack Build
# Next.js 14 + Express API Server + Cloudinary Support
#
# IMPORTANT: Next.js runs in NODE runtime (not Edge)
# All API routes are handled by Express server
#
# BUILD VERSION: 2026-03-19-fix-prisma-fields

FROM node:20-alpine AS base

# Install dependencies for Prisma and sharp
RUN apk add --no-cache openssl libc6-compat

# ==================================
# SERVER BUILD
# ==================================
FROM base AS server-builder

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Copy Prisma schema BEFORE npm install (needed for postinstall script)
COPY server/prisma ./prisma

# Install ALL dependencies (postinstall will run prisma generate)
RUN npm install

# Copy server source files
COPY server/tsconfig.json ./
COPY server/src ./src

# Generate Prisma Client explicitly (with DATABASE_URL for validation)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
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

# Copy client source files (excluding api directory via .dockerignore)
COPY client/ .

# Environment variables for Next.js build
# These are build-time only, runtime values are set via Railway env vars
ENV NEXT_PUBLIC_API_URL="/api"

# Build Next.js (creates .next/standalone)
# Next.js runs in Node runtime (not Edge)
RUN npm run build

# Verify build output
RUN ls -la /client/.next/standalone && echo "✅ .next/standalone exists"
RUN ls -la /client/.next/static && echo "✅ .next/static exists"

# Ensure public directory exists
RUN mkdir -p /client/public && echo "✅ public directory ensured"

# ==================================
# PRODUCTION IMAGE - Express + Next.js
# ==================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
# DO NOT set PORT here - Railway injects it at runtime
# PORT will be provided by Railway environment

# Create non-root user (Railway uses nodejs user)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy server build (Express API + Next.js handler)
COPY --from=server-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=server-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=server-builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=server-builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy Next.js standalone build to client directory
# Express server will load Next.js from here
RUN mkdir -p ./client
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/standalone/. ./client/
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/static ./client/.next/static
COPY --from=client-builder --chown=nodejs:nodejs /client/server.js ./client/server.js
COPY --from=client-builder --chown=nodejs:nodejs /client/package.json ./client/package.json

# Copy client public directory to BOTH ./public (root) and ./client/public
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./public
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./client/public

# Create uploads directory at root level for local file storage
RUN mkdir -p ./uploads && chown nodejs:nodejs ./uploads

# Create tmp directory for file uploads (Cloudinary temp files)
RUN mkdir -p /tmp && chown nodejs:nodejs /tmp

# Verify the build structure
RUN echo "=== Build Verification ===" && \
    echo "Client directory contents:" && ls -la ./client/ && \
    echo ".next directory contents:" && ls -la ./client/.next/ 2>/dev/null || echo ".next not found" && \
    echo "Public directory contents:" && ls -la ./public/ && \
    echo "Dist directory contents:" && ls -la ./dist/ && \
    echo "========================="

# Set correct permissions for all directories
RUN chown -R nodejs:nodejs /app

USER nodejs

# EXPOSE is for documentation only - Railway uses PORT env var
EXPOSE 5000

# Health check for Railway - uses PORT env var
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const p=process.env.PORT||5000; require('http').get('http://localhost:'+p+'/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Express server which handles both API routes and Next.js pages
# Next.js runs in Node runtime (not Edge)
# Run db push first to sync schema, then start server
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss || true && node dist/server.js"]
