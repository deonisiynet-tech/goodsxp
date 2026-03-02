import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

// ==================================
// DIAGNOSTIC: Step 1 - File loaded
// ==================================
console.log('='.repeat(60));
console.log('🔧 SERVER FILE LOADED');
console.log('='.repeat(60));
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('📦 PORT:', process.env.PORT);
console.log('📦 DATABASE_URL:', process.env.DATABASE_URL ? '*** SET ***' : '❌ NOT SET');
console.log('='.repeat(60));

// Check critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL is not set!');
  console.error('❌ Please set DATABASE_URL environment variable in Railway Dashboard');
}

// Import routes - these will execute before any code runs
// If Prisma is not generated, this will throw an error
console.log('📥 Importing routes and middleware...');
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
console.log('✅ All imports completed successfully');

const app = express();
// Railway provides PORT environment variable, default to 5000 for local dev
const PORT = Number(process.env.PORT) || 5000;

console.log('🚀 Initializing Express app...');

// Security
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'https://healthcheck.railway.app',
      '*',
    ];
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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================================
// CRITICAL: Health check MUST be defined FIRST
// ==================================
console.log('✅ Registering /health endpoint...');
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
  });
});

// Alternative health check endpoint
console.log('✅ Registering /healthz endpoint...');
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Root endpoint
console.log('✅ Registering / endpoint...');
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'GoodsXP API',
    version: '1.0.0',
    status: 'running',
    port: PORT,
  });
});

// API Routes
console.log('✅ Registering API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Error handling
console.log('✅ Registering error handlers...');
app.use(notFound);
app.use(errorHandler);

// ==================================
// DIAGNOSTIC: Step 2 - Before listen
// ==================================
console.log('='.repeat(60));
console.log('🎧 ABOUT TO LISTEN on port', PORT);
console.log('🌐 Binding to 0.0.0.0:', PORT);
console.log('='.repeat(60));

// ==================================
// Start server on 0.0.0.0
// ==================================
const server = app.listen(PORT, '0.0.0.0', () => {
  // ==================================
  // DIAGNOSTIC: Step 3 - Server started
  // ==================================
  console.log('='.repeat(60));
  console.log('✅ SERVER STARTED');
  console.log('🚀 Server running on port', PORT);
  console.log('🌐 Listening on 0.0.0.0:', PORT);
  console.log('✅ Health check available at http://localhost:' + PORT + '/health');
  console.log('✅ Health check available at http://localhost:' + PORT + '/healthz');
  console.log('='.repeat(60));
}).on('error', (err: any) => {
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
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

console.log('📡 Registering process handlers...');
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('✅ All startup procedures completed');
console.log('='.repeat(60));

export default app;
