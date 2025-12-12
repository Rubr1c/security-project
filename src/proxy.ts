import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './lib/logger';
import { STATUS } from './lib/http/status-codes';
import { jwt, JwtPayload } from './lib/jwt';
import arcjet, { detectBot, shield, tokenBucket } from '@arcjet/next';
import { env } from './lib/env';

const AUTH_COOKIE_NAME = 'auth-token';

export const aj = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:MONITOR', 'CATEGORY:PREVIEW'],
    }),
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5,
      interval: 10,
      capacity: 15,
    }),
  ],
});

export async function proxy(req: NextRequest) {
  const { pathname, protocol, host, searchParams } = req.nextUrl;
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const referer = req.headers.get('referer') || null;
  const contentType = req.headers.get('content-type') || null;

  logger.info({
    message: `${req.method} request made to ${pathname}`,
    meta: {
      method: req.method,
      pathname,
      protocol,
      host,
      ip,
      userAgent,
      referer,
      contentType,
      queryParams: Object.fromEntries(searchParams),
      headers: {
        'x-forwarded-for': req.headers.get('x-forwarded-for'),
        'x-real-ip': req.headers.get('x-real-ip'),
        'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
        'x-forwarded-host': req.headers.get('x-forwarded-host'),
      },
    },
  });

  const publicAuthPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/verify-otp',
    '/api/v1/auth/resend-otp',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
  ];

  if (publicAuthPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (stateChangingMethods.includes(req.method)) {
    const cookieToken = req.cookies.get('csrf-token')?.value;
    const headerToken = req.headers.get('x-csrf-token');

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      logger.warn({
        message: 'CSRF token validation failed',
        meta: { pathname },
      });
      return NextResponse.json(
        { error: 'Forbidden: Invalid CSRF token' },
        { status: STATUS.FORBIDDEN }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
