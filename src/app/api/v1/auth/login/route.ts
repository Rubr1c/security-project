import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { loginSchema } from '@/lib/validation/user-schemas';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { logger } from '@/lib/logger';
import { aj } from '@/proxy';
import { generateOtpCode, hashOtpCode, otpExpiresAtISO } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email/send-otp';
import { decrypt, hashEmail, BCRYPT_COST } from '@/lib/security/crypto';
import { authService, ServiceError } from '@/services/auth-service';

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-mitigation', BCRYPT_COST);

export async function POST(req: Request) {
  const decision = await aj.protect(req, { requested: 5 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      logger.info({
        message: 'Too Many Requests',
        meta: { reason: decision.reason },
      });
      return NextResponse.json({}, { status: STATUS.TOO_MANY_REQUESTS });
    } else if (decision.reason.isBot()) {
      logger.info({
        message: 'No bots allowed',
        meta: { reason: decision.reason },
      });
      return NextResponse.json(
        { error: 'No bots allowed' },
        { status: STATUS.FORBIDDEN }
      );
    } else {
      logger.info({
        message: 'Forbidden',
        meta: { reason: decision.reason },
      });
      return NextResponse.json({}, { status: STATUS.FORBIDDEN });
    }
  }

  const body = await req.json();
  const result = v.safeParse(loginSchema, body);

  if (!result.success) {
    delete body.password;

    logger.info({ message: 'Invalid login request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  logger.info({
    message: 'Login attempt', // concise log
  });

  try {
    const serviceResult = await authService.login(
      result.output.email,
      result.output.password
    );

    logger.info({
      message: 'OTP sent for login',
      meta: {
        userId: serviceResult.userId,
      },
    });

    return NextResponse.json(
      {
        otpRequired: serviceResult.otpRequired,
        email: serviceResult.email,
      },
      { status: STATUS.OK }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      logger.info({
        message: 'Login failed',
        meta: { error: error.message },
      });
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    
    logger.error({
        message: 'Login error',
        error: error as Error,
    });
    return NextResponse.json(
        { error: 'An unexpected error occurred.' },
        { status: STATUS.INTERNAL_ERROR }
    );
  }
}
