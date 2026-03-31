import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware для перевірки статусу магазину
 * Працює на сервері до завантаження сторінки
 *
 * Якщо storeEnabled = false:
 * - Показує сторінку maintenance для всіх користувачів
 * - Крім адмінів (/admin, /api/admin)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🛠️ DEBUG: Логуємо кожен запит
  console.log('[MIDDLEWARE] request:', pathname);

  // ✅ НЕ ПЕРЕВІРЯЄМО технічні маршрути та maintenance
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/robots.txt') ||
    pathname === '/maintenance'
  ) {
    console.log('[MIDDLEWARE] skipping technical route:', pathname);
    return NextResponse.next();
  }

  // ✅ ОТРИМУЄМО статус магазину через Internal API
  // Використовуємо INTERNAL_API_URL або будуємо URL з request
  const internalUrl = process.env.INTERNAL_API_URL || 'http://localhost:8080';
  const storeStatusUrl = `${internalUrl}/api/admin/settings/storeEnabled`;
  
  console.log('[MIDDLEWARE] fetching from:', storeStatusUrl);

  let storeEnabled = true; // За замовчуванням включений

  try {
    const response = await fetch(storeStatusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      storeEnabled = data.value !== 'false';
      console.log('[MIDDLEWARE] storeEnabled:', storeEnabled, '(value:', data.value, ')');
    } else {
      console.warn('[MIDDLEWARE] API returned:', response.status);
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Store status check failed:', error instanceof Error ? error.message : error);
    // fail-safe: якщо API недоступний, вважаємо що магазин включений
    storeEnabled = true;
  }

  // ✅ ЯКЩО МАГАЗИН ВИМКНЕНИЙ - редірект на maintenance
  if (!storeEnabled) {
    console.log('[MIDDLEWARE] redirecting to maintenance');
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }

  console.log('[MIDDLEWARE] allowing request to proceed');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Перевіряти всі маршрути крім:
     * - api (API routes)
     * - admin (адмінка)
     * - _next (Next.js internals)
     * - favicon.ico, sitemap.xml, robots.txt
     * - maintenance (сторінка технічних робіт)
     */
    '/((?!api|admin|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|maintenance).*)',
  ],
};
