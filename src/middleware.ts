import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We use the fbToken cookie set by the AuthProvider
  const fbToken = request.cookies.get('fbToken');
  const path = request.nextUrl.pathname;

  // Basic route protection
  if (!fbToken && (path.startsWith('/admin') || path.startsWith('/manager') || path.startsWith('/profile'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // NOTE: Role-based authorization should happen in API routes or Server Components 
  // since we cannot reliably decode Firebase tokens on the Edge runtime without external libraries.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/manager/:path*', '/profile/:path*'],
};
