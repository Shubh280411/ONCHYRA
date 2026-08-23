import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/profile', '/deposit', '/withdraw', '/referrals', '/packages', '/income', '/leaderboard', '/contests', '/p2p-transfer'];
const authRoutes = ['/login', '/register'];
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const uid = request.cookies.get('onc_uid')?.value;

  if (authRoutes.some(route => pathname.startsWith(route)) && uid) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (protectedRoutes.some(route => pathname.startsWith(route)) && !uid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!uid) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/deposit/:path*', '/withdraw/:path*',
    '/referrals/:path*', '/packages/:path*', '/income/:path*', '/leaderboard/:path*',
    '/contests/:path*', '/p2p-transfer/:path*', '/login', '/register', '/admin/:path*'],
};
