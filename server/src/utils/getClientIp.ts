import { Request } from 'express';

/**
 * Get real client IP address from request
 * Handles proxies, CDN, and load balancers correctly
 *
 * Priority:
 * 1. CF-Connecting-IP (Cloudflare CDN - most accurate)
 * 2. X-Forwarded-For (first IP in the chain)
 * 3. X-Real-IP (nginx proxy)
 * 4. Socket remote address
 */
export function getClientIp(req: Request): string {
  // 1. Cloudflare CDN (якщо використовується)
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') {
    return normalizeIp(cfIp);
  }

  // 2. X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
  // We want the FIRST one (the original client)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string'
      ? forwarded.split(',')
      : forwarded;
    const clientIp = ips[0].trim();
    return normalizeIp(clientIp);
  }

  // 3. X-Real-IP is set by some proxies (nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return normalizeIp(realIp);
  }

  // 4. Fallback to socket address
  const socketIp = req.socket.remoteAddress || req.connection?.remoteAddress;
  if (socketIp) {
    return normalizeIp(socketIp);
  }

  // 🔍 DEBUG: Log when IP cannot be determined
  console.warn('⚠️ IP Detection Failed:', {
    path: req.path,
    method: req.method,
    headers: {
      'cf-connecting-ip': req.headers['cf-connecting-ip'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
    },
    socket: {
      remoteAddress: req.socket.remoteAddress,
      connectionRemoteAddress: req.connection?.remoteAddress,
    },
  });

  return 'unknown';
}

/**
 * Normalize IP address
 * - Remove IPv6 prefix "::ffff:" for IPv4-mapped addresses
 * - Trim whitespace
 */
function normalizeIp(ip: string): string {
  let normalized = ip.trim();

  // Remove IPv6 prefix for IPv4-mapped addresses
  // "::ffff:192.168.1.1" -> "192.168.1.1"
  if (normalized.startsWith('::ffff:')) {
    normalized = normalized.substring(7);
  }

  // Handle localhost variations
  if (normalized === '::1') {
    return '127.0.0.1';
  }

  return normalized;
}
