// middleware.ts
// Standard Platfrmr middleware: auth + subscription gating
// Runs on Edge runtime — keep lean, no Node.js APIs

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require auth
const PUBLIC_ROUTES = ['/', '/pricing', '/blog', '/login', '/signup', '/api/webhooks'];

// Routes that require auth but no subscription
const FREE_ROUTES = ['/onboarding', '/billing', '/settings/billing'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check auth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow auth'd-but-not-subscribed routes
  if (FREE_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check subscription status (carried in JWT — refreshed via Stripe webhook → JWT update)
  const subStatus = token.subscriptionStatus as string | undefined;
  const isActive = subStatus === 'active' || subStatus === 'trialing';

  if (!isActive) {
    return NextResponse.redirect(new URL('/billing', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except static files, _next internals, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
