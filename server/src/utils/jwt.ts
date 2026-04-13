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
 * 🔒 SECURITY: Enforce HS256 algorithm to prevent JWT algorithm confusion attacks.
 */
export const JWT_ALGORITHM = 'HS256';

/**
 * Get JWT expiration from env with fallback.
 * 🔒 Reduced from 7d to 1d for admin tokens (security best practice).
 */
export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '1d';
}

/**
 * Token version counter — increment to invalidate ALL existing tokens.
 * Use this for: password changes, suspected compromises, security events.
 * Store this in the JWT payload as `v` and compare with User.tokenVersion.
 */
export function getTokenVersion(): number {
  return parseInt(process.env.TOKEN_VERSION || '1', 10);
}
