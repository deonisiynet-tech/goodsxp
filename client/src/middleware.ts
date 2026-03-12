import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Note: Middleware in Next.js runs on Edge runtime by default
// This is required for middleware to function properly
// Do not change runtime to 'nodejs' as middleware won't work

// Routes that require admin authentication
const adminRoutes = [
  '/admin',
  '/admin/products',
  '/admin/orders',
  '/admin/users',
  '/admin/settings',
  '/admin/logs',
]

// Login route - should be accessible without auth
const loginRoute = '/admin/login'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is an admin route
  const isAdminRoute = adminRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // Check if accessing login page
  const isLoginRoute = pathname === loginRoute

  // Get the session cookie
  const sessionCookie = request.cookies.get('admin_session')?.value

  // If no session and trying to access admin route
  if (!sessionCookie && isAdminRoute) {
    // Redirect to login with return URL
    const loginUrl = new URL(loginRoute, request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If has session and trying to access login page
  if (sessionCookie && isLoginRoute) {
    // Redirect to admin dashboard
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
