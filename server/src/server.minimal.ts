/**
 * Minimal server for Railway health check testing
 * No Prisma, no database, just /health endpoint
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health endpoints (MUST work)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: 'minimal',
  });
});

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'GoodsXP API (Minimal)',
    version: '1.0.0',
    status: 'running',
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});

export default app;
