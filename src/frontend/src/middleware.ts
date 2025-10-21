/**
 * Next.js Middleware - Production Security
 *
 * Blocks access to test/debug pages in production environment
 *
 * @author Scout (Investigation & Diagnostics Specialist)
 * @created 2025-10-17
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In development, allow everything
    return NextResponse.next();
  }

  // Block test/debug pages in production
  const blockedPaths = [
    '/particles-test',
    '/particles-leaves',
    '/projection-minimal',
    '/projection-flutter-test',
    '/checkerboard-flutter-test',
    '/swimming-test',
  ];

  const pathname = request.nextUrl.pathname;

  if (blockedPaths.some(path => pathname.startsWith(path))) {
    // Return 404 for blocked pages
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
