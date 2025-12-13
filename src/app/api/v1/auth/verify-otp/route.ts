import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { authService, ServiceError } from '@/services/auth-service';

const verifySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = v.safeParse(verifySchema, body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const { email, code } = parsed.output;

  try {
    const { token, userId } = await authService.verifyOtp(email, code);

    logger.info({
      message: 'OTP verified',
      meta: { userId },
    });

    const isProduction = env.NODE_ENV === 'production';
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return NextResponse.json({ success: true }, { status: STATUS.OK });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Verify OTP error', error: error as Error });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: STATUS.INTERNAL_ERROR }
    );
  }
}
