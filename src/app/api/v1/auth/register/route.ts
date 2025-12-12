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

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, result.output.email));

  if (existing.length > 0) {
    logger.info({
      message: 'Email already exists',
      meta: { email: result.output.email },
    });

    return NextResponse.json(
      { error: 'Email already exists' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const nowIso = new Date().toISOString();

  db.insert(users)
    .values({
      email: result.output.email,
      name: result.output.name,
      passwordHash: await bcrypt.hash(result.output.password, 10),
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
    .where(eq(users.email, result.output.email));

  if (!created) {
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
    to: created.email,
    code,
    expiresMinutes: 10,
  });

  logger.info({
    message: 'User created, OTP sent',
    meta: {
      email: result.output.email,
    },
  });

  return NextResponse.json(
    { otpRequired: true, email: result.output.email },
    { status: STATUS.CREATED }
  );
}
