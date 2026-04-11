/**
 * Centralized JWT secret getter — ensures the same secret is used everywhere.
 * Fails fast if JWT_SECRET is not configured.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET is not configured!');
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

/**
 * Get JWT expiration from env with fallback.
 */
export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}
