import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await requireRole('admin');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only admin can delete nurses',
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

  // Only select needed columns - avoid fetching sensitive fields
  const nurse = db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
    .all();

  if (nurse.length === 0) {
    return NextResponse.json(
      { error: 'Nurse not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  // Constrain delete to role='nurse' for safety
  const deleteResult = db
    .delete(users)
    .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
    .run();

  if (deleteResult.changes === 0) {
    return NextResponse.json(
      { error: 'Nurse not found or already deleted' },
      { status: STATUS.NOT_FOUND }
    );
  }

  logger.info({
    message: 'Nurse deleted successfully',
    meta: { id: nurseId, deletedBy: session.userId },
  });

  return NextResponse.json({ message: 'Nurse Deleted' }, { status: STATUS.OK });
}
