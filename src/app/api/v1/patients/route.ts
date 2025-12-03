import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  if (req.headers.get('x-user-role') !== 'doctor') {
    logger.info({
      message: 'Unauthorized',
      meta: {
        'x-user-id': req.headers.get('x-user-id') ?? 'unknown',
        'x-user-role': req.headers.get('x-user-role') ?? 'unknown',
      },
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const doctorId = parseInt(req.headers.get('x-user-id') ?? '0');

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

  return NextResponse.json(patients);
}
