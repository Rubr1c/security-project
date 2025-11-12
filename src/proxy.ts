import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './lib/logger';
import { STATUS } from './lib/http/status-codes';
import { jwt, JwtPayload } from './lib/jwt';
import arcjet, { detectBot, request, shield, tokenBucket } from "@arcjet/next";
import { isSpoofedBot } from "@arcjet/inspect";

export const aj = arcjet({
  key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    tokenBucket({
      mode: "LIVE",
      // Tracked by IP address by default, but this can be customized
      // See https://docs.arcjet.com/fingerprints
      //characteristics: ["ip.src"],
      refillRate: 5, // Refill 5 tokens per interval
      interval: 10, // Refill every 10 seconds
      capacity: 10, // Bucket capacity of 10 tokens
    }),
  ],
});

export async function proxy(req: NextRequest) {
  const decision = await aj.protect(req, { requested: 5 });
  if (decision.isDenied()) {
    return NextResponse.json(
      { error: "Access denied by Arcjet" },
      { status: 403 }
    );
  }

  if (decision.results.some(isSpoofedBot)) {
    return NextResponse.json(
      { error: "Forbidden", reason: decision.reason },
      { status: 403 },
    );
  }
  
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
      'x-user-id': decoded.userId.toString(),
      'x-user-role': decoded.role,
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
