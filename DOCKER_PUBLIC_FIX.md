# 🔧 FIX: Docker Public Directory Not Found

## Проблема

```
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./public
failed to compute cache key: "/client/public": not found
```

## Причина

1. **Next.js standalone build НЕ копіює `public` directory**
   - Standalone build копіює тільки `.next/standalone` та `.next/static`
   - `public` directory залишається в оригінальній директорії `/client`

2. **Docker COPY вимагає щоб джерело існувало**
   - Якщо `/client/public` порожній або не існує → Docker падає
   - Навіть якщо `.gitkeep` існує, Docker може його ігнорувати

## Рішення

### 1. Створити placeholder файли в `client/public`

```
client/public/
├── uploads/
│   └── .gitkeep
├── README.md          ← Новий файл
└── placeholder.txt    ← Новий файл
```

**Чому це працює:**
- Docker бачить що directory не порожній
- Файли гарантують що COPY не впаде
- `README.md` пояснює призначення директорії

### 2. Оновити Dockerfile

```dockerfile
FROM base AS client-builder

WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ .                    # Копіюємо ВСЕ включаючи public
COPY server/prisma ./prisma
RUN npx prisma generate
RUN npm run build

# Перевірка що build успішний
RUN ls -la /client/.next/standalone && echo "✅ .next/standalone exists"
RUN ls -la /client/.next/static && echo "✅ .next/static exists"

# Гарантуємо існування public directory
RUN mkdir -p /client/public && echo "✅ public directory ensured"

# Створюємо placeholder якщо public порожній
RUN if [ ! "$(ls -A /client/public)" ]; then \
      echo "Public directory placeholder" > /client/public/.gitkeep; \
      echo "✅ Placeholder created"; \
    else \
      echo "✅ Public directory already has files"; \
    fi
```

### 3. Копіювати public на production stage

```dockerfile
FROM base AS runner

WORKDIR /app

# ... copy server files ...

# Copy Next.js standalone
RUN mkdir -p ./client
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/standalone/. ./client/
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/static ./client/.next/static

# Copy public directory to BOTH locations
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./public
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./client/public

# Create uploads directory
RUN mkdir -p ./uploads && chown nodejs:nodejs ./uploads
```

**Чому два COPY:**
- `./public` - для доступу через Express static middleware
- `./client/public` - для сумісності з Next.js standalone

### 4. Оновити server.ts

```typescript
// Serve from root public
const rootPublicDir = path.join(process.cwd(), 'public');
app.use(express.static(rootPublicDir));

// Serve from client/public (standalone)
const clientPublicDir = path.join(clientDir, 'public');
app.use(express.static(clientPublicDir));

// Serve uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
```

## ✅ Перевірка

### Локально з Docker:

```bash
# Build image
docker build -t shop-mvp .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e CLOUDINARY_CLOUD_NAME="..." \
  shop-mvp

# Check public directory
docker exec -it <container-id> ls -la /public
docker exec -it <container-id> ls -la /client/public
```

### Після деплою на Railway:

```bash
# Check health
curl https://your-app.railway.app/health

# Check public files
curl https://your-app.railway.app/README.md
curl https://your-app.railway.app/placeholder.txt

# Check uploads
curl https://your-app.railway.app/uploads/test.jpg
```

## 📁 Структура файлів

```
shop-mvp/
├── Dockerfile                    # Оновлений
├── server/
│   └── src/
│       └── server.ts             # Оновлений (static middleware)
└── client/
    └── public/
        ├── uploads/
        │   └── .gitkeep
        ├── README.md             ← Новий
        └── placeholder.txt       ← Новий
```

## 🎯 Checklist

```
✅ client/public існує з файлами
✅ Dockerfile має mkdir -p /client/public
✅ Dockerfile має COPY public двічі
✅ server.ts serve static з обох шляхів
✅ uploads directory створено
✅ permissions встановлено (nodejs:nodejs)
```

## 🚀 Deploy

```bash
git add .
git commit -m "Fix: Docker public directory not found"
git push
```

Railway автоматично передеплоїть з новим Dockerfile.
