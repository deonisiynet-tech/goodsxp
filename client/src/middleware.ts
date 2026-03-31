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
    return NextResponse.next();
  }

  // ✅ ОТРИМУЄМО статус магазину через внутрішній API
  // Використовуємо http://127.0.0.1 замість localhost для уникнення DNS проблем
  const port = process.env.PORT || '8080';
  const internalUrl = `http://127.0.0.1:${port}`;
  const storeStatusUrl = `${internalUrl}/api/admin/settings/storeEnabled`;

  console.log('[Middleware] fetching from:', storeStatusUrl);

  let storeEnabled = true; // За замовчуванням включений

  try {
    const response = await fetch(storeStatusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // ✅ NO CACHE - завжди актуальне значення
      cache: 'no-store',
    });

    console.log('[Middleware] API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Middleware] storeEnabled value:', data.value);
      storeEnabled = data.value !== 'false';
    } else {
      console.warn('[Middleware] API returned:', response.status);
    }
  } catch (error) {
    console.error('[Middleware] Store status check failed:', error instanceof Error ? error.message : error);
    // fail-safe: якщо API недоступний, вважаємо що магазин включений
    storeEnabled = true;
  }

  // ✅ ЯКЩО МАГАЗИН ВИМКНЕНИЙ - редірект на maintenance
  if (!storeEnabled) {
    console.log('[Middleware] redirecting to maintenance');
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|admin|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|maintenance).*)',
  ],
};
