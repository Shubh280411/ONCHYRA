import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/profile', '/deposit', '/withdraw', '/referrals', '/packages', '/income', '/leaderboard', '/contests', '/p2p-transfer', '/onx-airdrop', '/onx-withdrawal', '/ai-miner', '/updates', '/news', '/support', '/leadership', '/streaks'];
const authRoutes = ['/login', '/register'];
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const uid = request.cookies.get('onc_uid')?.value;
  const cleanHost = hostname.replace(/^www\./, '');

  // Redirect www to app subdomain
  if (hostname.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.hostname = 'app.' + cleanHost;
    return NextResponse.redirect(url, 301);
  }

  // Redirect bare domain to app subdomain
  if (cleanHost === 'onchyra.online') {
    const url = request.nextUrl.clone();
    url.hostname = 'app.onchyra.online';
    return NextResponse.redirect(url, 301);
  }

  // Admin subdomain: rewrite /users -> /admin/users, /deposits -> /admin/deposits etc.
  if (cleanHost === 'admin.onchyra.online') {
    // If already has /admin prefix, let it through
    if (pathname.startsWith('/admin')) {
      // Auth check for admin
      if (!uid) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      return NextResponse.next();
    }
    // Rewrite root and other paths to /admin/*
    const url = request.nextUrl.clone();
    if (pathname === '/') {
      url.pathname = '/admin';
    } else {
      url.pathname = '/admin' + pathname;
    }
    return NextResponse.rewrite(url);
  }

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|ONX-logo.png|omchyra-logo.png|404.webp|api/).*)'],
};
