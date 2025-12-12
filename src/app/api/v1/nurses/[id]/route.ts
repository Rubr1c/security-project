import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  if (req.headers.get('x-user-role') !== 'admin') {
    logger.info({
      message: 'Unauthorized: Only admin can delete nurses',
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

  const { id } = await params;
  const nurseId = parseInt(id);

  if (Number.isNaN(nurseId) || nurseId <= 0) {
    return NextResponse.json(
      { error: 'Invalid nurse ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const nurse = db
    .select()
    .from(users)
    .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
    .all();

  if (nurse.length === 0) {
    return NextResponse.json(
      { error: 'Nurse not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  db.delete(users).where(eq(users.id, nurseId)).run();

  logger.info({
    message: 'Nurse deleted successfully',
    meta: { id: nurseId, deletedBy: req.headers.get('x-user-id') ?? 'unknown' },
  });

  return NextResponse.json({ message: 'Nurse Deleted' }, { status: STATUS.OK });
}
