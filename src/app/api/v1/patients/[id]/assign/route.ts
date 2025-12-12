import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
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

  const { id } = await params;
  const patientId = parseInt(id);

  if (isNaN(patientId) || patientId <= 0) {
    return NextResponse.json(
      { error: 'Invalid patient ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const doctorId = session.userId;

  const updateResult = await db
    .update(users)
    .set({ doctorId: doctorId, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(users.id, patientId),
        eq(users.role, 'patient'),
        or(isNull(users.doctorId), eq(users.doctorId, doctorId))
      )
    );

  if (updateResult.changes === 0) {
    const existingPatient = db
      .select({ id: users.id, role: users.role, doctorId: users.doctorId })
      .from(users)
      .where(eq(users.id, patientId))
      .all();

    if (existingPatient.length === 0) {
      logger.info({ message: 'Patient not found', meta: { patientId } });
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: STATUS.NOT_FOUND }
      );
    }

    if (existingPatient[0].role !== 'patient') {
      logger.info({
        message: 'Assign patient rejected: target user is not a patient',
        meta: { targetId: patientId, targetRole: existingPatient[0].role },
      });
      return NextResponse.json(
        { error: 'Target user is not a patient' },
        { status: STATUS.BAD_REQUEST }
      );
    }

    logger.info({
      message: 'Patient already assigned to another doctor',
      meta: {
        patientId,
        currentDoctorId: existingPatient[0].doctorId,
        requestingDoctorId: doctorId,
      },
    });
    return NextResponse.json(
      { error: 'Patient is already assigned to another doctor' },
      { status: STATUS.CONFLICT }
    );
  }

  logger.info({
    message: 'Patient assigned to doctor',
    meta: { patientId, doctorId },
  });

  return NextResponse.json(
    { message: 'Patient assigned to doctor' },
    { status: STATUS.OK }
  );
}
