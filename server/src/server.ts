import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Security
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from Railway healthcheck hostname
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
// CRITICAL: Health check MUST be defined FIRST (before API routes)
// ==================================
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Alternative health check endpoint (Railway compatible)
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'GoodsXP API',
    version: '1.0.0',
    status: 'running',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// ==================================
// Start server on 0.0.0.0
// ==================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Listening on 0.0.0.0:${PORT}`);
  console.log(`✅ Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
