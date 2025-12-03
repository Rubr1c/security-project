import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { changePasswordSchema } from '@/lib/validation/user-schemas';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';

export async function PUT(req: Request) {
  const userIdHeader = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');

  // User must be authenticated (have valid x-user-id header)
  if (!userIdHeader) {
    logger.info({
      message: 'Unauthorized: No user ID in request',
      meta: {
        'x-user-role': userRole ?? 'unknown',
      },
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const userId = parseInt(userIdHeader);

  if (isNaN(userId) || userId <= 0) {
    logger.info({
      message: 'Invalid user ID',
      meta: { userIdHeader },
    });

    return NextResponse.json(
      { error: 'Invalid user ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const body = await req.json();
  const result = v.safeParse(changePasswordSchema, body);

  if (!result.success) {
    logger.info({
      message: 'Invalid change password request',
      meta: { userId },
    });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  // Verify old password and new password are different
  if (result.output.oldPassword === result.output.newPassword) {
    logger.info({
      message: 'New password must be different from old password',
      meta: { userId },
    });

    return NextResponse.json(
      { error: 'New password must be different from old password' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  // Get current user
  const user = db.select().from(users).where(eq(users.id, userId)).all();

  if (user.length === 0) {
    logger.info({
      message: 'User not found',
      meta: { userId },
    });

    return NextResponse.json(
      { error: 'User not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  // Verify old password with bcrypt
  const passwordMatched = await bcrypt.compare(
    result.output.oldPassword,
    user[0].passwordHash
  );

  if (!passwordMatched) {
    logger.info({
      message: 'Invalid old password',
      meta: { userId },
    });

    return NextResponse.json(
      { error: 'Invalid old password' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  // Hash and save new password
  const newPasswordHash = await bcrypt.hash(result.output.newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));

  logger.info({
    message: 'Password changed successfully',
    meta: { userId },
  });

  return NextResponse.json(
    { message: 'Password changed successfully' },
    { status: STATUS.OK }
  );
}
