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
  const origin = request.nextUrl.origin; // ✅ Отримуємо origin (протокол + хост + порт)

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

  // ✅ ЗА ЗАМОВЧУВАННЯМ - МАГАЗИН ВКЛЮЧЕНИЙ
  let isStoreEnabled = true;

  // ✅ ПЕРЕВІРЯЄМО статус магазину на сервері
  // Використовуємо ПОВНИЙ URL для fetch (протокол + хост + порт)
  try {
    const fullUrl = `${origin}/api/admin/settings/storeEnabled`;
    console.log('[MIDDLEWARE] full URL:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // ✅ NO CACHE - завжди актуальне значення
      cache: 'no-store',
    });

    console.log('[MIDDLEWARE] API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[MIDDLEWARE] API response data:', data);
      console.log('[MIDDLEWARE] storeEnabled value:', data.value);
      
      isStoreEnabled = data.value !== 'false';
      console.log('[MIDDLEWARE] isStoreEnabled:', isStoreEnabled);
    } else {
      // Якщо API повернув помилку - вважаємо що магазин включений (fail-safe)
      console.warn('[Middleware] API returned non-OK status:', response.status);
    }
  } catch (error) {
    // ✅ У разі помилки API - пропускаємо користувача (fail-safe)
    console.error('[Middleware] Store status check failed:', error instanceof Error ? error.message : error);
    isStoreEnabled = true;
  }

  // ✅ ЯКЩО МАГАЗИН ВИМКНЕНИЙ - редірект на maintenance
  if (!isStoreEnabled) {
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
