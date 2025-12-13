import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { aj } from '@/proxy';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { authService, ServiceError } from '@/services/auth-service';

export async function POST(req: Request) {
  const decision = await aj.protect(req, { requested: 7 });

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

  const result = v.safeParse(createUserSchema, body);

  if (!result.success) {
    delete body.password;

    logger.info({ message: 'Invalid register request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    const serviceResult = await authService.register(result.output);

    logger.info({
      message: 'User created, OTP sent',
    });

    return NextResponse.json(
      { otpRequired: serviceResult.otpRequired, email: serviceResult.email },
      { status: STATUS.CREATED }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    logger.error({ message: 'Register error', error: error as Error });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: STATUS.INTERNAL_ERROR }
    );
  }
}
