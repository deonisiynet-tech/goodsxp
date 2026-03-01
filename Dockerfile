# Multi-stage Dockerfile for GoodsXP
# This builds both server and client

FROM node:20-alpine AS base

# ==================================
# SERVER BUILD
# ==================================
FROM base AS server-deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm install

FROM base AS server-builder
WORKDIR /app/server
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY server .

# Copy build-time env for Prisma
COPY server/.env.build ./server/.env

# Generate Prisma Client and build
RUN npx prisma generate
RUN npm run build

FROM base AS server-runner
WORKDIR /app
ENV NODE_ENV production

# Copy files first
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/package.json ./

# Generate Prisma Client at runtime (when DATABASE_URL is available)
RUN npx prisma generate || true

# Create user and set permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
