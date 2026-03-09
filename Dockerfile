# Root Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy and install server dependencies (NO React/Next.js here!)
COPY server/package*.json ./
# Install ALL dependencies for build (including devDependencies for TypeScript)
RUN npm install

# Copy server source files
COPY server/tsconfig.json ./
COPY server/src ./src

# Copy Prisma schema and generate Prisma Client BEFORE building server
COPY server/prisma ./prisma

# Generate Prisma Client
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

# Build TypeScript server
RUN npm run build

# Build client (Next.js) - THIS IS WHERE REACT LIVES
WORKDIR /client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies (includes React, Next.js, @prisma/client)
RUN npm install --omit=dev

# Copy Prisma schema for client Prisma generation
COPY server/prisma ./prisma

# Generate Prisma Client for Server Actions
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

# Copy rest of client source code (NOT the whole client folder!)
COPY client/src ./src
COPY client/public ./public
COPY client/next.config.mjs ./
COPY client/tailwind.config.js ./
COPY client/postcss.config.js ./
COPY client/tsconfig.json ./
COPY client/next-env.d.ts ./

# Build Next.js
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
CMD ["npm", "run", "start"]
