# =========================================
# Shop MVP - Fullstack Production Dockerfile
# =========================================
# Stack: Next.js 14 + Express + Prisma + PostgreSQL
# React 18.3.1 with @react-leaflet/core 3.0.0
# 
# BUILD STRATEGY:
# - Server: Standard npm install
# - Client: --legacy-peer-deps (ignores React 19 peer conflict)
# - Output: Next.js standalone + Express server
# =========================================

FROM node:20-alpine AS base

# Install system dependencies required for Prisma, sharp, and leaflet
RUN apk add --no-cache openssl libc6-compat

# =========================================
# STAGE 1: SERVER BUILD
# =========================================
FROM base AS server-builder

WORKDIR /app

# Copy server package files first (better layer caching)
COPY server/package*.json ./

# Copy Prisma schema BEFORE npm install (needed for postinstall script)
COPY server/prisma ./prisma

# Install server dependencies
# Prisma generate runs automatically via postinstall hook
RUN npm install

# Copy server source code
COPY server/tsconfig.json ./
COPY server/src ./src

# Generate Prisma Client explicitly with proper schema path
# Using dummy URL for build-time validation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build TypeScript to JavaScript
RUN npm run build

# Verify build output
RUN echo "✅ Server build complete" && ls -la ./dist/

# =========================================
# STAGE 2: CLIENT BUILD (with --legacy-peer-deps)
# =========================================
FROM base AS client-builder

WORKDIR /client

# Copy client package files
COPY client/package*.json ./

# CRITICAL: Install with --legacy-peer-deps
# This ignores the peer dependency conflict:
# @react-leaflet/core@3.0.0 requires React 19, but we use React 18.3.1
# The packages are still compatible in practice
# 
# Also install react-is explicitly (required by recharts)
RUN npm install --legacy-peer-deps && \
    npm install react-is --legacy-peer-deps

# Copy client source code
COPY client/ .

# Set build-time environment variables for Next.js
# These configure API URL and output format
ENV NEXT_PUBLIC_API_URL="/api"
ENV NODE_ENV=production
ENV NEXT_BUILD_TIMEOUT=300000
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application with timeout protection
# Creates standalone output in .next/standalone
# Timeout after 10 minutes to prevent hanging builds
RUN timeout 600 npm run build || (echo "❌ Build timeout after 10 minutes" && exit 1)

# Verify build artifacts exist
RUN echo "✅ Client build complete" && \
    echo "Checking standalone output..." && \
    ls -la /client/.next/standalone/ && \
    echo "Checking static files..." && \
    ls -la /client/.next/static/

# Ensure public directory exists
RUN mkdir -p /client/public

# =========================================
# STAGE 3: PRODUCTION RUNNER
# =========================================
FROM base AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
# PORT is set by Railway at runtime, not here

# Create non-root user for security (Railway convention)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# ----- Copy Server Build -----
COPY --from=server-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=server-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=server-builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=server-builder --chown=nodejs:nodejs /app/prisma ./prisma

# ----- Copy Client Build -----
# Next.js standalone build (contains server.js and .next)
RUN mkdir -p ./client
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/standalone/. ./client/
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/static ./client/.next/static
COPY --from=client-builder --chown=nodejs:nodejs /client/server.js ./client/server.js
COPY --from=client-builder --chown=nodejs:nodejs /client/package.json ./client/package.json

# ----- Copy Public Assets -----
# Copy to both root and client directories for compatibility
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./public
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./client/public

# ----- Create Required Directories -----
# Uploads directory for local file storage
RUN mkdir -p ./uploads && chown nodejs:nodejs ./uploads

# Temp directory for file uploads (Cloudinary, etc.)
RUN mkdir -p /tmp && chown nodejs:nodejs /tmp

# ----- Verify Build Structure -----
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "📁 Client directory:" && ls -la ./client/ && \
    echo "📁 .next directory:" && ls -la ./client/.next/ 2>/dev/null || echo ".next not found" && \
    echo "📁 Public directory:" && ls -la ./public/ && \
    echo "📁 Dist directory:" && ls -la ./dist/ && \
    echo "========================="

# Set ownership for all files
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (documentation only - Railway uses PORT env var)
EXPOSE 5000

# Health check endpoint for Railway
# Checks /health endpoint on the configured PORT
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const p=process.env.PORT||5000; require('http').get('http://localhost:'+p+'/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Startup command:
# 1. Run Prisma migrations (safe, no data loss)
# 2. Start Express server (handles API + Next.js)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"]
