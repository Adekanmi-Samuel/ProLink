import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge Middleware for ProLink
 *
 * NOTE: Auth is handled client-side via `withAuth` HOC and `api.ts` interceptors.
 * The backend returns JWT tokens in JSON responses (not cookies), so edge-level
 * auth checks are not possible. This middleware handles:
 *
 * 1. Security headers at the edge
 * 2. Bot and scraper blocking on private routes
 * 3. API route CORS preflight headers
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── 1. Add security headers at the edge ──
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ── 2. Block common bots/scrapers on private endpoints ──
  const PRIVATE_PATHS = ['/dashboard', '/admin', '/chat', '/profile/edit'];
  const isPrivateRoute = PRIVATE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const isBot =
    userAgent.includes('ahrefsbot') ||
    userAgent.includes('semrushbot') ||
    userAgent.includes('dotbot') ||
    userAgent.includes('mj12bot') ||
    userAgent.includes('spider') ||
    userAgent.includes('crawler');

  if (isPrivateRoute && isBot) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  // ── 3. Handle API route CORS for preflight ──
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const apiResponse = new NextResponse(null, { status: 204 });
    apiResponse.headers.set('Access-Control-Allow-Origin', '*');
    apiResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    apiResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    apiResponse.headers.set('Access-Control-Max-Age', '86400');
    return apiResponse;
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
