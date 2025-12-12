import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { OTP_MAX_ATTEMPTS, isExpired, verifyOtpCode } from '@/lib/otp';
import { jwt } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

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
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      otpHash: users.otpHash,
      otpExpiresAt: users.otpExpiresAt,
      otpAttempts: users.otpAttempts,
    })
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid code' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  if (!user.otpHash || !user.otpExpiresAt) {
    return NextResponse.json(
      { error: 'No active code. Request a new code.' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many attempts. Request a new code.' },
      { status: STATUS.TOO_MANY_REQUESTS }
    );
  }

  if (isExpired(user.otpExpiresAt)) {
    return NextResponse.json(
      { error: 'Code expired. Request a new code.' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const ok = await verifyOtpCode(code, user.otpHash);
  const nowIso = new Date().toISOString();

  if (!ok) {
    await db
      .update(users)
      .set({
        otpAttempts: (user.otpAttempts ?? 0) + 1,
        updatedAt: nowIso,
      })
      .where(eq(users.id, user.id));

    logger.info({
      message: 'Invalid OTP attempt',
      meta: { userId: user.id, email },
    });

    return NextResponse.json(
      { error: 'Invalid code' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  await db
    .update(users)
    .set({
      otpHash: null,
      otpExpiresAt: null,
      otpLastSentAt: null,
      otpAttempts: 0,
      emailVerifiedAt: user.emailVerifiedAt ?? nowIso,
      updatedAt: nowIso,
    })
    .where(eq(users.id, user.id));

  logger.info({
    message: 'OTP verified',
    meta: { userId: user.id, email },
  });

  const token = await jwt.sign({ userId: user.id, role: user.role });
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
}
