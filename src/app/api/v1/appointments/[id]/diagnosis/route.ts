import { db } from '@/lib/db/client';
import { appointments } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { updateDiagnosisSchema } from '@/lib/validation/appointment-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/security/crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctors can update diagnosis',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const appointmentId = parseInt(id);

  if (isNaN(appointmentId) || appointmentId <= 0) {
    logger.info({
      message: 'Invalid appointment ID',
      meta: { id },
    });

    return NextResponse.json(
      { error: 'Invalid appointment ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const body = await req.json();
  const result = v.safeParse(updateDiagnosisSchema, body);

  if (!result.success) {
    logger.info({ message: 'Invalid update diagnosis request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const doctorId = session.userId;

  const appointment = db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.doctorId, doctorId)
      )
    )
    .all();

  if (appointment.length === 0) {
    logger.info({
      message: 'Appointment not found or not assigned to this doctor',
      meta: { appointmentId, doctorId },
    });

    return NextResponse.json(
      { error: 'Appointment not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  const updateResult = await db
    .update(appointments)
    .set({
      diagnosis: encrypt(result.output.diagnosis),
      status: 'completed',
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(appointments.id, appointmentId), eq(appointments.doctorId, doctorId))
    );

  if (updateResult.changes === 0) {
    logger.info({
      message: 'Diagnosis update failed - appointment not found or not owned by doctor',
      meta: { appointmentId, doctorId },
    });

    return NextResponse.json(
      { error: 'Appointment not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  logger.info({
    message: 'Diagnosis updated successfully',
    meta: {
      appointmentId,
      doctorId,
    },
  });

  return NextResponse.json(
    { message: 'Diagnosis updated successfully' },
    { status: STATUS.OK }
  );
}
