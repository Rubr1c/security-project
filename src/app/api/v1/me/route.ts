import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
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

  const userId = session.userId;

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
