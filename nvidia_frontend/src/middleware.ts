import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// These routes require authentication
const protectedRoutes = ['/dashboard'];

// These routes should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Basic session cookie check - Better Auth sets this cookie
  // Note: We just check for its existence at the edge. The actual validation
  // happens when hitting the API from Server Components.
  const sessionCookie = request.cookies.get('better-auth.session_token') || 
                       request.cookies.get('__Secure-better-auth.session_token');

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login/signup
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow all other routes (like /share/* and /api/*)
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except api, _next/static, _next/image, favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
