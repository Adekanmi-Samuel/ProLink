import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Route protection configuration ──────────────────────────────────

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify',
  '/terms',
  '/privacy',
  '/talent',
  '/profiles',
  '/jobs',
  '/_next',
  '/api',
  '/favicon',
];

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

const PROTECTED_ROUTES = ['/dashboard', '/admin', '/profile/edit', '/profile/settings'];

/**
 * Edge Middleware for ProLink
 *
 * Handles:
 * 1. Authentication guards — redirect unauthenticated users to login
 * 2. Redirect already-authenticated users away from auth pages
 * 3. Security headers at the edge
 * 4. Bot and request validation
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── 1. Check authentication via token cookie ──
  const authToken = request.cookies.get('token')?.value;
  const isAuthenticated = !!authToken;

  // Detect if the path is public (starts with any public prefix)
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // ── 2. Redirect unauthenticated users from protected routes ──
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Redirect authenticated users away from auth pages ──
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── 4. Add security headers at the edge ──
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ── 5. Block common bots/scrapers on non-public endpoints ──
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  if (
    !isPublicRoute &&
    !isAuthenticated &&
    (userAgent.includes('ahrefsbot') ||
      userAgent.includes('semrushbot') ||
      userAgent.includes('dotbot') ||
      userAgent.includes('mj12bot'))
  ) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
