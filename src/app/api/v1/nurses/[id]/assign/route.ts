import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  if (req.headers.get('x-user-role') !== 'doctor') {
    logger.info({
      message: 'Unauthorized: Only doctor can assign nurses',
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

  // Verify the user being assigned is actually a nurse
  const nurse = db
    .select()
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

  const doctorId = parseInt(req.headers.get('x-user-id') ?? '0');

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

  await db
    .update(users)
    .set({ doctorId: doctorId, updatedAt: new Date().toISOString() })
    .where(eq(users.id, nurseId));

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

export async function DELETE(req: Request, { params }: RouteParams) {
  if (req.headers.get('x-user-role') !== 'doctor') {
    logger.info({
      message: 'Unauthorized: Only doctor can unassign nurses',
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

  const doctorId = parseInt(req.headers.get('x-user-id') ?? '0');
  if (!doctorId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  // Verify the user is a nurse and currently assigned to this doctor
  const nurse = db
    .select()
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

  await db
    .update(users)
    .set({ doctorId: null, updatedAt: new Date().toISOString() })
    .where(eq(users.id, nurseId));

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