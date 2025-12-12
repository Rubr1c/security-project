import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { eq, and, or, isNull } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(_req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctor can assign nurses',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const nurseId = parseInt(id);

  if (isNaN(nurseId) || nurseId <= 0) {
    logger.info({
      message: 'Invalid nurse ID',
      meta: { id },
    });

    return NextResponse.json(
      { error: 'Invalid nurse ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  // Only select needed columns - avoid fetching sensitive fields
  const nurse = db
    .select({ id: users.id, role: users.role, doctorId: users.doctorId })
    .from(users)
    .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
    .all();

  if (nurse.length === 0) {
    logger.info({
      message: 'Nurse not found',
      meta: { nurseId },
    });

    return NextResponse.json(
      { error: 'Nurse not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  const doctorId = session.userId;

  // Check if nurse is already assigned to another doctor
  if (nurse[0].doctorId !== null && nurse[0].doctorId !== doctorId) {
    logger.info({
      message: 'Nurse is already assigned to another doctor',
      meta: {
        nurseId,
        currentDoctorId: nurse[0].doctorId,
        requestingDoctorId: doctorId,
      },
    });

    return NextResponse.json(
      { error: 'Nurse is already assigned to another doctor' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  // Atomic update scoped to nurse role and assignment state
  const updateResult = await db
    .update(users)
    .set({ doctorId: doctorId, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(users.id, nurseId),
        eq(users.role, 'nurse'),
        // Only allow if unassigned or already assigned to this doctor
        or(isNull(users.doctorId), eq(users.doctorId, doctorId))
      )
    );

  if (updateResult.changes === 0) {
    // The pre-check passed but update failed - likely a race condition or data changed
    logger.info({
      message: 'Nurse assignment failed - concurrent modification',
      meta: { nurseId, doctorId },
    });

    return NextResponse.json(
      { error: 'Nurse assignment failed. Please try again.' },
      { status: STATUS.CONFLICT }
    );
  }

  logger.info({
    message: 'Nurse assigned to doctor',
    meta: {
      nurseId,
      doctorId,
    },
  });

  return NextResponse.json(
    { message: 'Nurse assigned to doctor' },
    { status: STATUS.OK }
  );
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctor can unassign nurses',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const nurseId = parseInt(id);

  if (isNaN(nurseId) || nurseId <= 0) {
    logger.info({
      message: 'Invalid nurse ID',
      meta: { id },
    });

    return NextResponse.json(
      { error: 'Invalid nurse ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const doctorId = session.userId;

  // Only select needed columns - avoid fetching sensitive fields
  const nurse = db
    .select({ id: users.id, role: users.role, doctorId: users.doctorId })
    .from(users)
    .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
    .all();

  if (nurse.length === 0) {
    logger.info({
      message: 'Nurse not found',
      meta: { nurseId },
    });

    return NextResponse.json(
      { error: 'Nurse not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  if (nurse[0].doctorId === null) {
    return NextResponse.json(
      { message: 'Nurse is already unassigned' },
      { status: STATUS.OK }
    );
  }

  if (nurse[0].doctorId !== doctorId) {
    logger.info({
      message: 'Unauthorized: Cannot unassign nurse from another doctor',
      meta: {
        nurseId,
        nurseDoctorId: nurse[0].doctorId,
        requestingDoctorId: doctorId,
      },
    });

    return NextResponse.json(
      { error: 'Forbidden' },
      { status: STATUS.FORBIDDEN }
    );
  }

  // Atomic update scoped to nurse role and this doctor
  const updateResult = await db
    .update(users)
    .set({ doctorId: null, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(users.id, nurseId),
        eq(users.role, 'nurse'),
        eq(users.doctorId, doctorId)
      )
    );

  if (updateResult.changes === 0) {
    logger.info({
      message: 'Nurse unassignment failed - not assigned to this doctor',
      meta: { nurseId, doctorId },
    });

    return NextResponse.json(
      { error: 'Nurse unassignment failed' },
      { status: STATUS.CONFLICT }
    );
  }

  logger.info({
    message: 'Nurse unassigned from doctor',
    meta: {
      nurseId,
      doctorId,
    },
  });

  return NextResponse.json(
    { message: 'Nurse unassigned from doctor' },
    { status: STATUS.OK }
  );
}
