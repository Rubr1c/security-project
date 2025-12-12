import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { decryptUserFields } from '@/lib/security/fields';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'auth-token';

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

  return NextResponse.json(decryptUserFields(user[0]));
}

export async function DELETE() {
  const session = await getSession();

  if (!session) {
    logger.info({
      message: 'Unauthorized deletion attempt',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const userId = session.userId;

  // Strict Compliance Logging
  logger.getAuditLogger()?.logAccountDeletion(userId);

  // Anonymization (Soft Delete)
  const timestamp = Date.now();
  const randomSuffix = crypto.randomUUID();

  try {
    db.update(users)
      .set({
        name: `Deleted User ${userId}`,
        email: `deleted-${timestamp}-${randomSuffix}@healthcure.deleted`,
        emailHash: `deleted-${timestamp}-${randomSuffix}@healthcure.deleted`,
        passwordHash: 'DELETED_ACCOUNT_NO_LOGIN',
        role: 'patient',
        otpHash: null,
        pendingPasswordHash: null,
        pendingPasswordExpiresAt: null,
        otpExpiresAt: null,
        otpLastSentAt: null,
        otpAttempts: 0,
        emailVerifiedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .run();

    // Invalidate Session
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.json(
      { message: 'Account deleted and anonymized successfully.' },
      { status: STATUS.OK }
    );
  } catch (err: any) {
    logger.error({
      message: 'Failed to delete account',
      error: err,
      meta: { userId },
    });

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: STATUS.INTERNAL_ERROR }
    );
  }
}
