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
import { decrypt, hashEmail } from '@/lib/security/crypto';

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
    message: 'Fetching user from database for login attempt',
  });

  const emailHashValue = hashEmail(result.output.email);

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.emailHash, emailHashValue));

  if (!user) {
    logger.info({
      message: 'User not found during login attempt',
    });

    return NextResponse.json(
      { error: 'Invalid Credentials' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const passwordMatched = await bcrypt.compare(
    result.output.password,
    user.passwordHash
  );

  if (!passwordMatched) {
    logger.info({
      message: 'Invalid password',
      meta: { userId: user.id },
    });

    return NextResponse.json(
      { error: 'Invalid Credentials' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const code = generateOtpCode();
  const otpHash = await hashOtpCode(code);
  const expiresAt = otpExpiresAtISO();
  const nowIso = new Date().toISOString();

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

  const decryptedEmail = decrypt(user.email);

  await sendOtpEmail({
    to: decryptedEmail,
    code,
    expiresMinutes: 10,
  });

  logger.info({
    message: 'OTP sent for login',
    meta: {
      userId: user.id,
    },
  });

  return NextResponse.json(
    {
      otpRequired: true,
      email: decryptedEmail,
    },
    { status: STATUS.OK }
  );
}

