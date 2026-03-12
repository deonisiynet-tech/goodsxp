/**
 * Custom server for Next.js standalone build with Express integration
 * This file is used when running Next.js standalone with Express
 */

const path = require('path');
const express = require('express');

// Set production environment
process.env.NODE_ENV = 'production';

// Get the directory of this file
const dir = path.join(__dirname);

// Change to the standalone directory
process.chdir(dir);

// Set the standalone config from the original build
const nextConfig = {
  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },
};

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

// Initialize Next.js
const next = require('next');

const nextApp = next({
  dev: false,
  dir: dir,
});

const handle = nextApp.getRequestHandler();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All other requests handled by Next.js
app.all('*', (req, res) => {
  return handle(req, res);
});

// Prepare Next.js and start server
nextApp.prepare().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
