import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware для перевірки статусу магазину та захисту адмінки
 *
 * Якщо storeEnabled = false:
 * - Показує сторінку maintenance для всіх користувачів
 * - Крім адмінів (/admin-x8k2p9-panel, /api/admin)
 *
 * Блокує доступ до стандартних шляхів адмінки (/admin, /wp-admin і т.д.)
 */

// Отримуємо прихований шлях адмінки зі змінних оточення
const ADMIN_PANEL_PATH = process.env.ADMIN_PANEL_PATH || '/admin-x8k2p9-panel';

// Стандартні шляхи, які блокуються (для запобігання скануванню)
const BLOCKED_PATHS = [
  '/admin',
  '/wp-admin',
  '/administrator',
  '/dashboard',
  '/admin-panel',
  '/adminpanel',
  '/cpanel',
  '/manager',
  '/backend',
  '/control',
  '/console',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameLower = pathname.toLowerCase();

  // ✅ БЛОКУВАННЯ стандартних шляхів адмінки (повертаємо 404)
  for (const blockedPath of BLOCKED_PATHS) {
    if (
      pathnameLower === blockedPath ||
      pathnameLower === blockedPath + '/' ||
      pathnameLower.startsWith(blockedPath + '/')
    ) {
      console.warn(`🚨 Admin scanning attempt blocked: ${pathname} from ${request.ip}`);

      // Повертаємо 404 - наче такої сторінки не існує
      return new NextResponse(
        JSON.stringify({
          error: 'Not found',
          message: 'The page you are looking for does not exist.',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // ✅ НЕ ПЕРЕВІРЯЄМО технічні маршрути та приховану адмінку
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith(ADMIN_PANEL_PATH) ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/robots.txt') ||
    pathname === '/maintenance'
  ) {
    return NextResponse.next();
  }

  // ✅ ОТРИМУЄМО статус магазину через внутрішній API
  const port = process.env.PORT || '8080';
  const adminPanelPath = process.env.ADMIN_PANEL_PATH || '/admin-x8k2p9-panel';
  const internalUrl = `http://127.0.0.1:${port}`;
  const storeStatusUrl = `${internalUrl}/api${adminPanelPath}/settings/storeEnabled`;

  console.log('[Middleware] fetching from:', storeStatusUrl);

  let storeEnabled = true; // За замовчуванням включений

  try {
    const response = await fetch(storeStatusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|maintenance).*)',
  ],
};

// Експортуємо константу для використання в інших місцях
export { ADMIN_PANEL_PATH };
