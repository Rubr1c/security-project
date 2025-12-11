import { db } from '@/lib/db/client';
import { appointments } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { updateDiagnosisSchema } from '@/lib/validation/appointment-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  if (req.headers.get('x-user-role') !== 'doctor') {
    logger.info({
      message: 'Unauthorized: Only doctors can update diagnosis',
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

  const doctorId = parseInt(req.headers.get('x-user-id') ?? '0');

  // Verify the appointment exists and belongs to this doctor
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

  await db
    .update(appointments)
    .set({
      diagnosis: result.output.diagnosis,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(appointments.id, appointmentId));

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
