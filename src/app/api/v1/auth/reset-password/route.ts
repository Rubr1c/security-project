import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { createHash } from 'crypto';
import * as v from 'valibot';
import { resetPasswordSchema } from '@/lib/validation/auth-schemas';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = v.safeParse(resetPasswordSchema, body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    const { token, password } = result.output;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, tokenHash),
          gt(users.passwordResetTokenExpiresAt, new Date().toISOString())
        )
      );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    logger.info({
      message: 'Password reset successful',
      meta: { userId: user.id },
    });

    return NextResponse.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    logger.error({
      message: 'Error processing password reset',
      error: error as Error,
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: STATUS.INTERNAL_ERROR }
    );
  }
}
