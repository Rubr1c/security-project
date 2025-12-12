import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email/mailer';
import { hashEmail } from '@/lib/security/crypto';
import * as v from 'valibot';
import { forgotPasswordSchema } from '@/lib/validation/auth-schemas';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = v.safeParse(forgotPasswordSchema, body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    const { email } = result.output;
    const emailHashValue = hashEmail(email);

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.emailHash, emailHashValue));

    // Always return success even if user not found to prevent enumeration
    if (!user) {
      logger.info({
        message: 'Password reset requested for non-existent email',
        meta: { email },
      });
      return NextResponse.json({
        message: 'If an account exists, a reset link has been sent.',
      });
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour

    await db
      .update(users)
      .set({
        passwordResetToken: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
      })
      .where(eq(users.id, user.id));

    await sendPasswordResetEmail(email, token);

    logger.info({
      message: 'Password reset link sent',
      meta: { userId: user.id },
    });

    return NextResponse.json({
      message: 'If an account exists, a reset link has been sent.',
    });
  } catch (error) {
    logger.error({
      message: 'Error processing forgot password request',
      error: error as Error,
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: STATUS.INTERNAL_ERROR }
    );
  }
}
