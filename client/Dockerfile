# Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY client/package.json client/package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY client .

# Copy prisma schema and generate Prisma Client BEFORE build
COPY server/prisma ./prisma

# Environment variables for build
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
ENV CLOUDINARY_CLOUD_NAME=dho1q87qk
ENV CLOUDINARY_API_KEY=679329866265555
ENV CLOUDINARY_API_SECRET=Y8HzBE5cnLyz_86WXNLQ5tMfblU
ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]
