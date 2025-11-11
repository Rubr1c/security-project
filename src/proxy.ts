import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './lib/logger';
import { STATUS } from './lib/http/status-codes';
import { jwt, JwtPayload } from './lib/jwt';

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

  if (pathname.includes('/auth')) {
    return NextResponse.next();
  }
  
  logger.info({
    message: 'Authorizing User',
    meta: {
      authorization: req.headers.get('authorization'),
    },
  });

  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    logger.info({
      message: 'No token found',
      meta: {
        authorization: req.headers.get('authorization'),
      },
    });
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }
  const decoded = await jwt.verify<JwtPayload>(token);
  if (!decoded) {
    logger.info({
      message: 'Invalid token',
      meta: {
        authorization: req.headers.get('authorization'),
      },
    });
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  logger.debug({
    message: 'Token verified',
    meta: {
      decoded,
    },
  });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', decoded.userId.toString());
  requestHeaders.set('x-user-role', decoded.role);

  logger.info({
    message: 'Request headers set',
    meta: {
      requestHeaders,
    },
  });

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
