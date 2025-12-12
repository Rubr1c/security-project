import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import {
  generateOtpCode,
  hashOtpCode,
  isExpired,
  verifyOtpCode,
} from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email/send-otp';

export async function PUT(req: Request) {
  const session = await getSession();

  if (!session) {
    logger.info({
      message: 'Unauthorized: No valid session',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { userId, role: userRole } = session;

  const body = await req.json();

  const requestSchema = v.object({
    oldPassword: v.pipe(v.string(), v.minLength(1, 'Old password is required')),
    newPassword: v.pipe(
      v.string(),
      v.minLength(8, 'Password must be at least 8 characters'),
      v.regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      )
    ),
  });

  const verifySchema = v.object({
    code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
  });

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      otpHash: users.otpHash,
      otpExpiresAt: users.otpExpiresAt,
      otpAttempts: users.otpAttempts,
      pendingPasswordHash: users.pendingPasswordHash,
      pendingPasswordExpiresAt: users.pendingPasswordExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    logger.info({
      message: 'User not found',
      meta: { userId },
    });

    return NextResponse.json(
      { error: 'User not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  const verifyParsed = v.safeParse(verifySchema, body);
  if (verifyParsed.success) {
    if (!user.pendingPasswordHash || !user.pendingPasswordExpiresAt) {
      return NextResponse.json(
        { error: 'No pending password change request.' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    if (isExpired(user.pendingPasswordExpiresAt)) {
      await db
        .update(users)
        .set({
          pendingPasswordHash: null,
          pendingPasswordExpiresAt: null,
          otpHash: null,
          otpExpiresAt: null,
          otpLastSentAt: null,
          otpAttempts: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, user.id));

      return NextResponse.json(
        { error: 'Password change request expired. Start again.' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json(
        { error: 'No active code. Request a new code.' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    if (user.otpAttempts >= 5) {
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

    const ok = await verifyOtpCode(verifyParsed.output.code, user.otpHash);
    const nowIso = new Date().toISOString();

    if (!ok) {
      await db
        .update(users)
        .set({ otpAttempts: user.otpAttempts + 1, updatedAt: nowIso })
        .where(eq(users.id, user.id));

      return NextResponse.json(
        { error: 'Invalid code' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    await db
      .update(users)
      .set({
        passwordHash: user.pendingPasswordHash,
        pendingPasswordHash: null,
        pendingPasswordExpiresAt: null,
        otpHash: null,
        otpExpiresAt: null,
        otpLastSentAt: null,
        otpAttempts: 0,
        updatedAt: nowIso,
      })
      .where(eq(users.id, user.id));

    logger.info({
      message: 'Password changed (OTP verified)',
      meta: { userId: user.id, role: userRole },
    });

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: STATUS.OK }
    );
  }

  const requestParsed = v.safeParse(requestSchema, body);
  if (!requestParsed.success) {
    logger.info({
      message: 'Invalid change password request',
      meta: { userId },
    });

    return NextResponse.json(
      { error: requestParsed.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  if (requestParsed.output.oldPassword === requestParsed.output.newPassword) {
    return NextResponse.json(
      { error: 'New password must be different from old password' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const oldOk = await bcrypt.compare(
    requestParsed.output.oldPassword,
    user.passwordHash
  );
  if (!oldOk) {
    return NextResponse.json(
      { error: 'Invalid old password' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const pendingPasswordHash = await bcrypt.hash(
    requestParsed.output.newPassword,
    10
  );
  const code = generateOtpCode();
  const otpHash = await hashOtpCode(code);
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await db
    .update(users)
    .set({
      pendingPasswordHash,
      pendingPasswordExpiresAt: expiresAt,
      otpHash,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      otpLastSentAt: nowIso,
      updatedAt: nowIso,
    })
    .where(eq(users.id, user.id));

  await sendOtpEmail({ to: user.email, code, expiresMinutes: 10 });

  logger.info({
    message: 'Change password OTP sent',
    meta: { userId: user.id, role: userRole },
  });

  return NextResponse.json(
    { otpRequired: true, email: user.email },
    { status: STATUS.OK }
  );
}
