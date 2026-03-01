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
RUN npm run prisma:generate
RUN npm run build

FROM base AS server-runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/package.json ./

RUN npx prisma generate

USER nodejs
EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
