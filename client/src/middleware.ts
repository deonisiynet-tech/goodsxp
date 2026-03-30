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

  // ✅ НЕ ПЕРЕВІРЯЄМО технічні маршрути
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // ✅ ПЕРЕВІРЯЄМО статус магазину на сервері
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/admin/settings/storeEnabled`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // ✅ NO CACHE - завжди актуальне значення
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (response.ok) {
      const data = await response.json();
      const isStoreEnabled = data.value !== 'false';

      // ✅ ЯКЩО МАГАЗИН ВИМКНЕНИЙ - показуємо maintenance сторінку
      if (!isStoreEnabled) {
        const maintenanceUrl = new URL('/maintenance', request.url);
        return NextResponse.redirect(maintenanceUrl);
      }
    }
  } catch (error) {
    console.error('[Middleware] Error checking store status:', error);
    // У разі помилки - пропускаємо (fail-safe)
  }

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
     */
    '/((?!api|admin|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
