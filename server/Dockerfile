# Simple Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Create temporary .env for Prisma generate (DATABASE_URL not needed for client generation)
RUN echo 'DATABASE_URL="postgresql://temp:temp@localhost:5432/temp"' > .env

# Generate Prisma Client
RUN npx prisma generate

# Remove temporary .env
RUN rm -f .env

# Copy all source code
COPY . .

# Build TypeScript
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/server.js"]
