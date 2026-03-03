import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import createServer from 'next';
import { parse } from 'url';
import path from 'path';

dotenv.config();

console.log('🔧 SERVER FILE LOADED');
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('📦 PORT:', process.env.PORT);
console.log('📦 DATABASE_URL:', process.env.DATABASE_URL ? '*** SET ***' : '❌ NOT SET');

if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL is not set!');
}

// ==================================
// Ініціалізація Next.js
// ==================================
console.log('📦 Initializing Next.js...');

// Шлях до client directory
// У production (Docker): /app/client
// У development: ../../client відносно dist/server.js
const clientDir = process.env.NODE_ENV === 'production' && process.env.CLIENT_DIR
  ? path.resolve(process.env.CLIENT_DIR)
  : path.resolve(__dirname, '../../client');

console.log('📁 Client directory:', clientDir);

const nextApp = createServer({
  dev: false,
  dir: clientDir,
});

const nextHandle = nextApp.getRequestHandler();

// ==================================
// Імпорт API маршрутів
// ==================================
console.log('📥 Importing API routes...');
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
console.log('✅ All imports completed successfully');

// ==================================
// Створення Express додатку
// ==================================
const app = express();
const PORT = Number(process.env.PORT) || 5000;

console.log('🚀 Initializing Express app...');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'https://healthcheck.railway.app',
      '*',
    ];
    // Дозволяємо запити без origin (статичні файли, curl, тощо)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Дозволяємо запити до /_next без CORS обмежень
app.use('/_next', (_req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================================
// API Routes - обробляються ПЕРШИМИ
// ==================================
console.log('✅ Registering API routes...');

// Health check endpoint (критично для Railway)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
  });
});

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// API роути (всі запити до /api/...)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ==================================
// Next.js Static Assets - обробляються ДО всіх інших
// ==================================
console.log('✅ Registering Next.js static handler...');

// Запити до /_next/* обробляються напряму Next.js
app.all('/_next/*', (req: Request, res: Response) => {
  const parsedUrl = parse(req.url!, true);
  return nextHandle(req, res, parsedUrl);
});

// ==================================
// Next.js Handler - обробляє ВСІ інші запити
// ==================================
console.log('✅ Registering Next.js handler...');

// Всі інші запити → Next.js
app.all('*', (req: Request, res: Response) => {
  const parsedUrl = parse(req.url!, true);
  return nextHandle(req, res, parsedUrl);
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// ==================================
// Запуск сервера
// ==================================
console.log('🎧 ABOUT TO LISTEN on port', PORT);

// Спочатку готуємо Next.js, потім запускаємо сервер
nextApp.prepare().then(() => {
  console.log('✅ Next.js prepared successfully');
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('✅ SERVER STARTED');
    console.log('🚀 Server running on port', PORT);
    console.log('🌐 Listening on 0.0.0.0:', PORT);
    console.log('📡 API available at http://localhost:' + PORT + '/api');
    console.log('🏠 Frontend available at http://localhost:' + PORT);
    console.log('✅ Health check: http://localhost:' + PORT + '/health');
    console.log('='.repeat(60));
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error('❌ Port', PORT, 'is already in use!');
      process.exit(1);
    }
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(signal, 'received, shutting down...');
    server.close(() => {
      console.log('HTTP server closed');
      nextApp.close();
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Could not close connections in time');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  console.log('✅ All startup procedures completed');
}).catch((err: unknown) => {
  console.error('❌ Failed to prepare Next.js:', err);
  process.exit(1);
});

export default app;
