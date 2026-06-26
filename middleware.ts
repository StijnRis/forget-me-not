import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseSessionToken } from '@/lib/auth/session';

const protectedRoutes = ['/dashboard', '/teams'];

function redirectToSignIn(request: NextRequest, clearCookie: boolean) {
  const response = NextResponse.redirect(new URL('/sign-in', request.url));
  if (clearCookie) {
    response.cookies.delete('session');
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    if (isProtectedRoute) {
      return redirectToSignIn(request, false);
    }
    return NextResponse.next();
  }

  const session = await parseSessionToken(sessionToken);

  if (!session) {
    if (isProtectedRoute) {
      return redirectToSignIn(request, true);
    }
    const response = NextResponse.next();
    response.cookies.delete('session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
