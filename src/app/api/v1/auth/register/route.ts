import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { aj } from '@/proxy';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { generateOtpCode, hashOtpCode, otpExpiresAtISO } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email/send-otp';
import { encrypt, hashEmail, BCRYPT_COST } from '@/lib/security/crypto';
import { decryptUserFields } from '@/lib/security/fields';

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

  const emailHashValue = hashEmail(result.output.email);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.emailHash, emailHashValue));

  if (existing.length > 0) {
    logger.info({
      message: 'Email already exists during registration attempt',
    });

    return NextResponse.json(
      { error: 'Email already exists' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const nowIso = new Date().toISOString();

  db.insert(users)
    .values({
      email: encrypt(result.output.email),
      emailHash: emailHashValue,
      name: encrypt(result.output.name),
      passwordHash: await bcrypt.hash(result.output.password, BCRYPT_COST),
      role: 'patient',
      emailVerifiedAt: null,
      otpHash: null,
      otpExpiresAt: null,
      otpLastSentAt: null,
      otpAttempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .run();

  const [created] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.emailHash, emailHashValue));

  const decryptedCreated = created ? decryptUserFields(created) : null;

  if (!decryptedCreated) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: STATUS.INTERNAL_ERROR }
    );
  }

  const code = generateOtpCode();
  const otpHash = await hashOtpCode(code);
  const expiresAt = otpExpiresAtISO();

  await db
    .update(users)
    .set({
      otpHash,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      otpLastSentAt: nowIso,
      updatedAt: nowIso,
    })
    .where(eq(users.id, created.id));

  await sendOtpEmail({
    to: decryptedCreated.email,
    code,
    expiresMinutes: 10,
  });

  logger.info({
    message: 'User created, OTP sent',
  });

  return NextResponse.json(
    { otpRequired: true, email: result.output.email },
    { status: STATUS.CREATED }
  );
}
