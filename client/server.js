/**
 * Standalone Next.js server
 * Note: In this architecture, Express (dist/server.js) loads Next.js directly
 * This file is kept for reference and standalone deployments
 */

const path = require('path');

process.env.NODE_ENV = 'production';

// Get the directory containing this file
const dir = path.dirname(__filename);

// Initialize Next.js
const next = require('next');

const nextApp = next({
  dev: false,
  dir: dir,
});

const handle = nextApp.getRequestHandler();

// Prepare and start
nextApp.prepare().then(() => {
  console.log('✅ Next.js standalone server ready');
  console.log('📁 Running from:', dir);
}).catch((err) => {
  console.error('Failed to prepare Next.js:', err);
  process.exit(1);
});

// Export for use by Express
module.exports = { nextApp, handle, dir };
