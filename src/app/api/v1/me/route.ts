import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  const userIdHeader = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');

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

  // Fetch user profile (excluding password hash)
  const user = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      doctorId: users.doctorId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .all();

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

  logger.info({
    message: 'User profile fetched',
    meta: { userId },
  });

  return NextResponse.json(user[0]);
}
