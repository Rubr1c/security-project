import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import {
  OTP_RESEND_COOLDOWN_MS,
  generateOtpCode,
  hashOtpCode,
  otpExpiresAtISO,
} from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email/send-otp';
import { hashEmail, decrypt } from '@/lib/security/crypto';

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

  const { email } = parsed.output;
  const emailHashValue = hashEmail(email);

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      otpLastSentAt: users.otpLastSentAt,
    })
    .from(users)
    .where(eq(users.emailHash, emailHashValue));

  if (!user) {
    return NextResponse.json({ message: 'If the email exists, a code was sent.' });
  }

  const now = Date.now();
  if (user.otpLastSentAt) {
    const last = Date.parse(user.otpLastSentAt);
    if (!Number.isNaN(last) && now - last < OTP_RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        { error: 'Please wait before requesting a new code.' },
        { status: STATUS.TOO_MANY_REQUESTS }
      );
    }
  }

  const code = generateOtpCode();
  const otpHash = await hashOtpCode(code);
  const expiresAt = otpExpiresAtISO(now);
  const nowIso = new Date(now).toISOString();

  await db
    .update(users)
    .set({
      otpHash,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      otpLastSentAt: nowIso,
      updatedAt: nowIso,
    })
    .where(eq(users.id, user.id));

  await sendOtpEmail({ to: decrypt(user.email), code, expiresMinutes: 10 });

  logger.info({
    message: 'OTP resent',
    meta: { userId: user.id, email },
  });

  return NextResponse.json({ message: 'Code sent' }, { status: STATUS.OK });
}


