import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Flowoid Stock — Route Middleware
 *
 * Since we use localStorage (client-side) for auth, we can only check for the
 * presence of the auth token here. Deep role-based redirect happens client-side
 * in each layout. This middleware handles the basic redirect logic:
 *
 * - /login          → redirect to /dashboard if already logged in (handled client-side)
 * - /admin/*        → only for flowoid_admin (enforced client-side guard)
 * - /dashboard/*    → only for authenticated users (enforced client-side guard)
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — always allowed
  const publicRoutes = ['/', '/login', '/demo'];
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/demo'))) {
    return NextResponse.next();
  }

  // Static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For protected routes: we rely on client-side guards (localStorage-based auth)
  // because Next.js middleware cannot read localStorage.
  // The AuthGuard component in each layout handles the redirect.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*).*)',
  ],
};
