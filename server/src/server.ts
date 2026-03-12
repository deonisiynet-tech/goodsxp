import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import next from 'next';
import { parse } from 'url';
import cookieParser from 'cookie-parser';

dotenv.config();

console.log('🔧 SERVER FILE LOADED');
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('📦 PORT:', process.env.PORT);
console.log('📦 DATABASE_URL:', process.env.DATABASE_URL ? '*** SET ***' : '❌ NOT SET');

if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL is not set!');
}

// ==================================
// Next.js Initialization
// ==================================
console.log('📦 Initializing Next.js...');

// Determine client directory
// In production (Railway): Next.js standalone is in ./client directory
// In development: use ../../client relative to dist/server.js
let clientDir: string;
let isStandalone = false;

// Check if we're running in standalone mode
const standalonePath = path.join(process.cwd(), 'client', 'server.js');
if (fs.existsSync(standalonePath)) {
  // We're in production - Next.js standalone exists
  isStandalone = true;
  clientDir = path.join(process.cwd(), 'client');
  console.log('🚀 PRODUCTION MODE: Using Next.js standalone');
} else {
  // Development mode
  clientDir = path.resolve(__dirname, '../../client');
  console.log('🛠️ DEVELOPMENT MODE: Using Next.js dev server');
}

console.log('📁 Client directory:', clientDir);

// Check .next directory
const nextDir = path.join(clientDir, '.next');
console.log('📁 .next exists:', fs.existsSync(nextDir));

// Initialize Next.js
const nextApp = next({
  dev: false,
  dir: clientDir,
});

const nextHandle = nextApp.getRequestHandler();

// ==================================
// Import API Routes
// ==================================
console.log('📥 Importing API routes...');
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminAuthRoutes from './routes/admin.auth.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { initializeAdmin } from './utils/initAdmin.js';
console.log('✅ All imports completed successfully');

// ==================================
// Create Express App
// ==================================
const app = express();
const PORT = Number(process.env.PORT) || 5000;

console.log('🚀 Initializing Express app...');

// ==================================
// CORS Middleware
// ==================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  optionsSuccessStatus: 200,
}));

// Logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} | Origin: ${req.headers.origin || 'no-origin'}`);
  next();
});

// Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// ==================================
// Static Files - Uploads Directory
// ==================================
console.log('✅ Setting up static file serving...');

// Serve uploads from root level
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));
console.log('📁 Serving static files from:', uploadsDir);

// Also serve from root public directory (copied from client/public)
const rootPublicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(rootPublicDir)) {
  app.use(express.static(rootPublicDir));
  console.log('📁 Serving root public files from:', rootPublicDir);
}

// Also serve from client/public for Next.js assets (standalone build)
const clientPublicDir = path.join(clientDir, 'public');
if (fs.existsSync(clientPublicDir)) {
  app.use(express.static(clientPublicDir));
  console.log('📁 Serving client public files from:', clientPublicDir);
}

// ==================================
// Next.js Handler
// ==================================
console.log('✅ Registering Next.js handler...');

// All non-API requests go to Next.js
app.all('*', (req: Request, res: Response, next) => {
  const urlPath = req.path;

  // Skip API routes
  if (urlPath.startsWith('/api')) {
    return next();
  }

  // Handle with Next.js
  const parsedUrl = parse(req.url!, true);
  return nextHandle(req, res, parsedUrl);
});

// ==================================
// API Routes
// ==================================
console.log('✅ Registering API routes...');

// Health check
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/auth', adminAuthRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// ==================================
// Start Server
// ==================================
console.log('🎧 ABOUT TO LISTEN on port', PORT);

nextApp.prepare().then(async () => {
  console.log('✅ Next.js prepared successfully');

  // Initialize admin user
  await initializeAdmin();

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
