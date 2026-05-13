/**
 * Client-side authentication utilities
 *
 * These functions check for admin session cookies for UI decisions.
 * Actual authorization happens on backend via authenticate + authorize middleware.
 */

/**
 * Check if user has admin session cookie
 *
 * This is safe for UI decisions because:
 * - Cookie is set only after successful admin login
 * - Backend always validates session in DB before allowing actions
 * - Even if cookie is forged, backend will reject unauthorized requests
 *
 * @returns true if admin_session cookie exists
 */
export function hasAdminSession(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('admin_session=');
}

/**
 * Get cookie value by name
 *
 * @param name - Cookie name to retrieve
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

/**
 * Check if user is authenticated (has any auth token or session)
 *
 * @returns true if user has Bearer token or admin session
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  const hasToken = !!localStorage.getItem('token');
  const hasSession = hasAdminSession();

  return hasToken || hasSession;
}
