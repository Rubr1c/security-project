import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { decryptUserRecords } from '@/lib/security/fields';

export async function GET() {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const doctorId = session.userId;

  logger.info({
    message: 'Fetching patients',
    meta: {
      doctorId,
    },
  });

  const patients = db
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
    .where(and(eq(users.role, 'patient'), eq(users.doctorId, doctorId)))
    .all();

  logger.info({
    message: 'Patients fetched',
    meta: {
      count: patients.length,
    },
  });

  return NextResponse.json(decryptUserRecords(patients));
}
