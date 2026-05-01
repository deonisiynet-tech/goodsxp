/**
 * Centralized fetch wrapper for admin API calls
 * Handles authentication, CSRF tokens, and automatic logout on 401
 */

import { getAdminApiFullPath, getAdminLoginUrl } from './admin-paths';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipCsrf?: boolean;
}

/**
 * Get CSRF token from cookies
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Handle 401 response - logout and redirect
 */
function handleUnauthorized(path: string): never {
  if (typeof window === 'undefined') {
    throw new Error('Unauthorized');
  }

  // Clear any auth state
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Clear admin session cookie by setting it to expire
  document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  // Redirect to login with return URL
  const currentPath = window.location.pathname;
  window.location.href = getAdminLoginUrl(currentPath);

  // This will never return, but TypeScript needs it
  throw new Error('Unauthorized - redirecting to login');
}

/**
 * Admin fetch wrapper with automatic 401 handling
 *
 * Usage:
 *   const data = await adminFetch('/sessions');
 *   const data = await adminFetch('/sessions/123', { method: 'DELETE' });
 */
export async function adminFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, skipCsrf, ...fetchOptions } = options;

  // Build full URL
  const url = getAdminApiFullPath(path);

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add CSRF token for mutating requests
  if (!skipCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method?.toUpperCase() || 'GET')) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  // Always include credentials for admin requests (cookie-based auth)
  const finalOptions: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetch(url, finalOptions);

    // Handle 401 - session expired or deleted
    if (response.status === 401) {
      handleUnauthorized(path);
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Parse JSON response
    return await response.json();
  } catch (error: any) {
    // Network errors or JSON parse errors
    if (error.message === 'Failed to fetch') {
      throw new Error('Помилка з\'єднання з сервером');
    }
    throw error;
  }
}

/**
 * Shorthand methods for common HTTP verbs
 */
export const adminApi = {
  get: <T = any>(path: string, options?: FetchOptions) =>
    adminFetch<T>(path, { ...options, method: 'GET' }),

  post: <T = any>(path: string, body?: any, options?: FetchOptions) =>
    adminFetch<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(path: string, body?: any, options?: FetchOptions) =>
    adminFetch<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(path: string, body?: any, options?: FetchOptions) =>
    adminFetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(path: string, body?: any, options?: FetchOptions) =>
    adminFetch<T>(path, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
