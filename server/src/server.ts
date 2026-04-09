import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import next from 'next';
import { parse } from 'url';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';

// Завантажуємо .env з кореня проекту
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ==================================
// Startup Logging for Railway
// ==================================
console.log('='.repeat(60));
console.log('🚀 STARTING GOODSXP SERVER');
console.log('='.repeat(60));
console.log('🔧 SERVER FILE LOADED');
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('📦 PORT:', process.env.PORT || '❌ NOT SET (will use default)');
console.log('📦 DATABASE_URL:', process.env.DATABASE_URL ? '*** SET ***' : '❌ NOT SET');
console.log('='.repeat(60));

if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL is not set!');
  console.error('📝 Please ensure DATABASE_URL environment variable is configured');
  process.exit(1);
}

// ==================================
// Next.js Initialization
// ==================================
let clientDir: string;
const isProduction = process.env.NODE_ENV === 'production';

// In production, Next.js standalone is in ./client directory
// In development, use relative path from dist/server.js
if (isProduction) {
  clientDir = path.join(process.cwd(), 'client');
  console.log('🚀 PRODUCTION MODE: Using Next.js standalone from', clientDir);
} else {
  clientDir = path.resolve(__dirname, '../../client');
  console.log('🛠️ DEVELOPMENT MODE: Using Next.js from', clientDir);
}

// Verify client directory exists
if (!fs.existsSync(clientDir)) {
  console.error('❌ FATAL: Client directory not found:', clientDir);
  process.exit(1);
}

// Verify .next directory exists in production
if (isProduction) {
  const nextDir = path.join(clientDir, '.next');
  if (!fs.existsSync(nextDir)) {
    console.error('❌ FATAL: .next directory not found:', nextDir);
    process.exit(1);
  }
  console.log('✅ .next directory found');
}

// Initialize Next.js
const nextApp = next({
  dev: !isProduction,
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
import novaPoshtaRoutes from './routes/nova-poshta.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { adminRateLimiter, apiRateLimiter, strictRateLimiter } from './middleware/rateLimiter.js';
import { blockAdminScanning } from './middleware/adminPanelPath.js';
import { csrfProtection } from './middleware/csrf.js';
import { getAdminApiPrefix } from './utils/adminPaths.js';
import { initializeAdmin } from './utils/initAdmin.js';
import { runMigrations } from './prisma/migrate.js';
console.log('✅ All imports completed successfully');

// ==================================
// Create Express App
// ==================================
const app = express();
// Railway provides PORT via environment variable, default to 8080 if not set
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

console.log('🚀 Initializing Express app...');
console.log('📡 Server will listen on PORT:', PORT);

// ==================================
// CORS Middleware - Configured for production
// ==================================
// ✅ isProduction вже оголошена вище (Next.js initialization)

// ✅ В production НЕ дозволяємо localhost — тільки реальні домени
const corsAllowedOrigins = isProduction
  ? [
      process.env.CLIENT_URL || 'https://goodsxp.store',
      'https://goodsxp.store',
      'https://www.goodsxp.store',
    ]
  : [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
    ];

console.log('🔒 CORS mode:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('🔒 CORS allowed origins:', corsAllowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // ✅ Dynamic subdomain matching for Railway/preview environments
    // Only in development or if explicitly enabled
    if (!isProduction) {
      const allowedPatterns = [
        /^https?:\/\/localhost/,
        /^https?:\/\/127\.0\.0\.1/,
        /^https?:\/\/.*\.railway\.app$/,
        /^https?:\/\/.*\.vercel\.app$/,
      ];
      if (allowedPatterns.some(pattern => pattern.test(origin))) {
        return callback(null, true);
      }
    }

    // ✅ In production — strict matching only
    if (isProduction) {
      const allowedPatterns = [
        /^https?:\/\/goodsxp\.store$/,
        /^https?:\/\/www\.goodsxp\.store$/,
        /^https?:\/\/.*\.railway\.app$/,  // Railway preview
      ];
      if (allowedPatterns.some(pattern => pattern.test(origin))) {
        return callback(null, true);
      }
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // IMPORTANT: Allow cookies
  optionsSuccessStatus: 200,
}));

// Logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} | Origin: ${req.headers.origin || 'no-origin'}`);
  next();
});

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js потребує в dev режимі
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ✅ Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Body parsing — 2mb достатньо для e-commerce API
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Cookie parsing
app.use(cookieParser());

// Block admin scanning attempts
app.use(blockAdminScanning);

// ==================================
// Static Files
// ==================================
console.log('✅ Setting up static file serving...');

// Serve uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));
console.log('📁 Serving uploads from:', uploadsDir);

// Serve root public directory
const rootPublicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(rootPublicDir)) {
  app.use(express.static(rootPublicDir));
  console.log('📁 Serving root public files from:', rootPublicDir);
}

// Serve client public directory
const clientPublicDir = path.join(clientDir, 'public');
if (fs.existsSync(clientPublicDir)) {
  app.use(express.static(clientPublicDir));
  console.log('📁 Serving client public files from:', clientPublicDir);
}

// ==================================
// API Routes - MUST be registered BEFORE Next.js handler
// ==================================
console.log('✅ Registering API routes...');

// Health check endpoints
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

// API routes - these handle /api/* paths
// IMPORTANT: Admin API routes use dynamic path from ADMIN_PANEL_PATH env variable
const adminApiPrefix = getAdminApiPrefix();

app.use('/api/auth', apiRateLimiter, authRoutes); // ✅ Rate limited
// CSRF для admin auth routes (крім login — ще немає сесії)
app.use(`${adminApiPrefix}/auth/logout`, csrfProtection);
app.use(`${adminApiPrefix}/auth/2fa/generate`, csrfProtection);
app.use(`${adminApiPrefix}/auth/2fa/enable`, csrfProtection);
app.use(`${adminApiPrefix}/auth/2fa/disable`, csrfProtection);
app.use(`${adminApiPrefix}/auth`, adminRateLimiter, adminAuthRoutes);  // Admin auth with hidden path
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
// CSRF для адмінських маршрутів (cookie-based auth)
app.use(`${adminApiPrefix}`, csrfProtection);
app.use(`${adminApiPrefix}`, adminRoutes);           // Admin only - requires auth
app.use('/api/upload', uploadRoutes);
app.use('/api/nova-poshta', apiRateLimiter, novaPoshtaRoutes); // ✅ Rate limited
app.use('/api/analytics', analyticsRoutes);   // Analytics endpoints

console.log(`🔒 Admin API prefix: ${adminApiPrefix}`);

// ==================================
// Next.js Handler - MUST be last
// ==================================
console.log('✅ Registering Next.js handler...');

// All non-API requests go to Next.js
app.all('*', (req: Request, res: Response, next) => {
  const urlPath = req.path;

  // Skip API routes (should not happen as they're handled above)
  if (urlPath.startsWith('/api')) {
    console.log('⚠️ API route fell through to Next.js handler:', urlPath);
    return next();
  }

  // Handle with Next.js
  const parsedUrl = parse(req.url!, true);
  return nextHandle(req, res, parsedUrl);
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// ==================================
// Start Server
// ==================================
console.log('🎧 ABOUT TO LISTEN on port', PORT);

nextApp.prepare().then(async () => {
  console.log('✅ Next.js prepared successfully');

  // Run migrations first
  console.log('🔄 Running database migrations...');
  try {
    await runMigrations();
    console.log('✅ Database migrations completed');
  } catch (err: any) {
    console.error('⚠️ Migration warning:', err.message);
  }

  // Initialize admin user
  await initializeAdmin();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('✅ SERVER STARTED SUCCESSFULLY');
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

  // Log server listening event for Railway
  console.log('📡 Server listening on port', PORT);

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
