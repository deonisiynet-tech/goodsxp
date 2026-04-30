import { Request } from 'express';

/**
 * Get real client IP address from request
 * Handles proxies, CDN, and load balancers correctly
 *
 * Priority:
 * 1. X-Forwarded-For (first IP in the chain)
 * 2. X-Real-IP
 * 3. Socket remote address
 */
export function getClientIp(req: Request): string {
  // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
  // We want the FIRST one (the original client)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string'
      ? forwarded.split(',')
      : forwarded;
    const clientIp = ips[0].trim();
    return normalizeIp(clientIp);
  }

  // X-Real-IP is set by some proxies (nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return normalizeIp(realIp);
  }

  // Fallback to socket address
  const socketIp = req.socket.remoteAddress || req.connection?.remoteAddress;
  if (socketIp) {
    return normalizeIp(socketIp);
  }

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
