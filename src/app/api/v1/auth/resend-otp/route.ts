import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { authService, ServiceError } from '@/services/auth-service';

const resendSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = v.safeParse(resendSchema, body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    const result = await authService.resendOtp(parsed.output.email);

    if (result) {
      logger.info({
        message: 'OTP resent',
        meta: { userId: result.userId, email: result.email },
      });
    }

    return NextResponse.json({ message: 'Code sent' }, { status: STATUS.OK });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Resend OTP error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
