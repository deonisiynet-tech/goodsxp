/**
 * Client-side authentication utilities
 *
 * These functions check for admin session cookies for UI decisions.
 * Actual authorization happens on backend via authenticate + authorize middleware.
 */

/**
 * Check if user has admin session via backend API
 *
 * This is safe for UI decisions because:
 * - Backend validates session in DB before responding
 * - Returns { isAdmin: false } instead of 401 for non-admins (no errors in logs)
 * - Even if response is forged, backend will reject unauthorized actions
 *
 * @returns Promise<boolean> - true if valid admin session exists
 */
export async function checkAdminSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const response = await fetch('/api/admin-x8k2p9-panel/auth/check', {
      credentials: 'include', // Include httpOnly cookies
      cache: 'no-store', // Always get fresh data
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isAdmin === true;
  } catch (error) {
    console.debug('Admin check failed:', error);
    return false;
  }
}

/**
 * Check if user has admin session cookie (legacy - use checkAdminSession instead)
 *
 * Note: This doesn't work with httpOnly cookies, kept for compatibility
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
 * Note: This doesn't work with httpOnly cookies
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
