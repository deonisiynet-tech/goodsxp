// Middleware has been removed - it was using Edge runtime which caused SSR errors
// Admin authentication is now handled client-side via fetch to /api/admin/auth/me
// See: client/src/app/admin/login/page.tsx for implementation

// This file is intentionally empty to disable Edge runtime
// Middleware is disabled - no routes are being intercepted
