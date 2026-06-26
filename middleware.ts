import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';

const protectedRoutes = ['/dashboard', '/teams'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!sessionCookie?.value) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.next();
  }

  try {
    await verifyToken(sessionCookie.value);
    return NextResponse.next();
  } catch (error) {
    console.error('Invalid session:', error);
    const response = isProtectedRoute
      ? NextResponse.redirect(new URL('/sign-in', request.url))
      : NextResponse.next();
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
