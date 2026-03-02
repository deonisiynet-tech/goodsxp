FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# ==================================
# Крок 1: Встановлення залежностей client
# ==================================
COPY client/package*.json ./client/
RUN cd client && npm install

# ==================================
# Крок 2: Встановлення залежностей server
# ==================================
COPY server/package*.json ./server/
RUN cd server && npm install

# ==================================
# Крок 3: Копіювання всіх файлів
# ==================================
COPY client/ ./client/
COPY server/ ./server/

# ==================================
# Крок 4: Генерація Prisma Client
# ==================================
WORKDIR /app/server
RUN echo 'DATABASE_URL="postgresql://u:p@localhost:5432/db"' > .env && \
    npx prisma generate && \
    rm -f .env

# ==================================
# Крок 5: Збірка Next.js (client)
# ==================================
WORKDIR /app/client
RUN npm run build

# ==================================
# Крок 6: Збірка TypeScript (server)
# ==================================
WORKDIR /app/server
RUN npm run build

ENV NODE_ENV=production
ENV NEXT_DIR=./client

# Railway will inject PORT environment variable at runtime
# Server listens on 0.0.0.0:${PORT}

# ==================================
# Крок 7: Запуск сервера
# ==================================
WORKDIR /app/server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
